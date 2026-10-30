import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Factura } from '../../database/entities/factura.entity';
import { DetalleFactura } from '../../database/entities/detalle-factura.entity';
import { ServicioTransporte } from '../../database/entities/servicio-transporte.entity';
import { Cliente } from '../../database/entities/cliente.entity';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { EstadoServicio } from '../../common/enums';
import { PdfGeneratorService } from './pdf-generator.service';

@Injectable()
export class FacturasService {
  constructor(
    @InjectRepository(Factura)
    private readonly facturaRepo: Repository<Factura>,
    @InjectRepository(DetalleFactura)
    private readonly detalleRepo: Repository<DetalleFactura>,
    @InjectRepository(ServicioTransporte)
    private readonly servicioRepo: Repository<ServicioTransporte>,
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    private readonly configService: ConfigService,
    private readonly pdfGenerator: PdfGeneratorService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private round(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  async generarFactura(dto: CreateFacturaDto): Promise<Factura> {
    const cliente = await this.clienteRepo.findOne({ where: { id: dto.clienteId } });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener servicios dentro de la transacción
      const servicios = await queryRunner.manager.find(ServicioTransporte, {
        where: { id: In(dto.serviciosIds) },
        relations: ['vehiculo'],
      });

      if (servicios.length !== dto.serviciosIds.length) {
        throw new NotFoundException('Uno o más servicios especificados no fueron encontrados');
      }

      let subtotalBase = 0;
      let totalRecargos = 0;
      const detallesParaGuardar: { servicio: ServicioTransporte; tarifa: number; recargos: number }[] = [];

      for (const servicio of servicios) {
        // Validación: Pertenecen al mismo cliente
        if (servicio.clienteId !== dto.clienteId) {
          throw new BadRequestException(
            `El servicio ${servicio.codigo} no pertenece al cliente especificado`,
          );
        }

        // Validación: Facturar exclusivamente servicios completados
        if (servicio.estado !== EstadoServicio.COMPLETADO) {
          throw new BadRequestException(
            `El servicio ${servicio.codigo} se encuentra en estado '${servicio.estado}'. Solo se pueden facturar servicios completados.`,
          );
        }

        // Validación: Cada servicio solo puede aparecer en una factura
        if (servicio.facturado) {
          throw new ConflictException(
            `El servicio ${servicio.codigo} ya ha sido facturado previamente`,
          );
        }

        const detalleExistente = await queryRunner.manager.findOne(DetalleFactura, {
          where: { servicioId: servicio.id },
        });
        if (detalleExistente) {
          throw new ConflictException(
            `El servicio ${servicio.codigo} ya está vinculado a la factura ${detalleExistente.facturaId}`,
          );
        }

        // Cálculo de recargos por servicio
        const tarifa = Number(servicio.tarifaCalculada);
        let recargoServicio = 0;

        // Recargo 1: Servicio de más de 300 km -> 6%
        if (Number(servicio.distanciaKm) > 300) {
          recargoServicio += tarifa * 0.06;
        }

        // Recargo 2: Servicio realizado en domingo -> 12%
        // Formato fecha: 'YYYY-MM-DD'
        const fechaObj = new Date(`${servicio.fecha}T12:00:00Z`);
        if (fechaObj.getUTCDay() === 0) {
          recargoServicio += tarifa * 0.12;
        }

        recargoServicio = this.round(recargoServicio);
        subtotalBase += tarifa;
        totalRecargos += recargoServicio;

        detallesParaGuardar.push({
          servicio,
          tarifa: this.round(tarifa),
          recargos: recargoServicio,
        });
      }

      subtotalBase = this.round(subtotalBase);
      totalRecargos = this.round(totalRecargos);

      // 2. Regla académica de descuento por cliente en el mes
      // Contar el histórico de servicios completados del cliente en el mes corriente
      const mesActual = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
      const totalCompletadosMes = await queryRunner.manager
        .createQueryBuilder(ServicioTransporte, 's')
        .where('s.clienteId = :clienteId', { clienteId: dto.clienteId })
        .andWhere('s.estado = :completado', { completado: EstadoServicio.COMPLETADO })
        .andWhere("TO_CHAR(s.fecha, 'YYYY-MM') = :mesActual", { mesActual })
        .getCount();

      let porcentajeDescuento = 0;
      if (totalCompletadosMes >= 6) {
        porcentajeDescuento = 0.10; // 10%
      } else if (totalCompletadosMes >= 3) {
        porcentajeDescuento = 0.05; // 5%
      }

      const importeDespuesDeRecargos = subtotalBase + totalRecargos;
      const montoDescuento = this.round(importeDespuesDeRecargos * porcentajeDescuento);
      const baseImponible = importeDespuesDeRecargos - montoDescuento;

      // 3. Impuesto (configurable, ej. 15%)
      const tasaImpuesto = Number(this.configService.get<number>('TAX_PERCENTAGE', 15.0));
      const montoImpuesto = this.round(baseImponible * (tasaImpuesto / 100));
      const totalFactura = this.round(baseImponible + montoImpuesto);

      // 4. Crear factura
      const codigoFactura = dto.codigo || `FAC-${Date.now().toString().slice(-6)}`;
      const factura = queryRunner.manager.create(Factura, {
        codigo: codigoFactura,
        clienteId: dto.clienteId,
        fecha: new Date(),
        subtotal: subtotalBase,
        recargos: totalRecargos,
        descuento: montoDescuento,
        impuesto: montoImpuesto,
        total: totalFactura,
      });

      const facturaGuardada = await queryRunner.manager.save(Factura, factura);

      // 5. Guardar detalles y marcar servicios como facturados
      for (const item of detallesParaGuardar) {
        const detalle = queryRunner.manager.create(DetalleFactura, {
          facturaId: facturaGuardada.id,
          servicioId: item.servicio.id,
          tarifa: item.tarifa,
          recargos: item.recargos,
        });
        await queryRunner.manager.save(DetalleFactura, detalle);

        item.servicio.facturado = true;
        await queryRunner.manager.save(ServicioTransporte, item.servicio);
      }

      await queryRunner.commitTransaction();
      return this.findOne(facturaGuardada.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string): Promise<Factura> {
    const factura = await this.facturaRepo.findOne({
      where: { id },
      relations: [
        'cliente',
        'detalles',
        'detalles.servicio',
        'detalles.servicio.vehiculo',
      ],
    });
    if (!factura) {
      throw new NotFoundException(`Factura con id ${id} no encontrada`);
    }
    return factura;
  }

  async findAll(): Promise<Factura[]> {
    return this.facturaRepo.find({
      relations: ['cliente', 'detalles'],
      order: { createdAt: 'DESC' },
    });
  }

  async generarPdf(id: string): Promise<Buffer> {
    const factura = await this.findOne(id);
    return this.pdfGenerator.generarFacturaPdf(factura);
  }
}
