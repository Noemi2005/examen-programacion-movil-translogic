import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { ServicioTransporte } from '../../database/entities/servicio-transporte.entity';
import { Vehiculo } from '../../database/entities/vehiculo.entity';
import { Cliente } from '../../database/entities/cliente.entity';
import { HistorialEstado } from '../../database/entities/historial-estado.entity';
import { FurgonetaElectrica } from '../../database/entities/furgoneta-electrica.entity';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { SimularTarifaDto } from './dto/simular-tarifa.dto';
import { AsignarVehiculoDto } from './dto/asignar-vehiculo.dto';
import { EstadoServicio, EstadoVehiculo, TipoVehiculo } from '../../common/enums';
import { TarifaCalculatorService } from '../vehiculos/tarifa-calculator.service';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(ServicioTransporte)
    private readonly servicioRepo: Repository<ServicioTransporte>,
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(HistorialEstado)
    private readonly historialRepo: Repository<HistorialEstado>,
    private readonly tarifaCalculator: TarifaCalculatorService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Valida solapamiento de horarios para un vehículo en una fecha dada.
   * Regla 7: Impedir horarios superpuestos para un mismo vehículo.
   */
  async validarSolapamientoHorario(
    vehiculoId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    servicioIdExcluido?: string,
  ): Promise<void> {
    const qb = this.servicioRepo
      .createQueryBuilder('s')
      .where('s.vehiculoId = :vehiculoId', { vehiculoId })
      .andWhere('s.fecha = :fecha', { fecha })
      .andWhere('s.estado != :cancelado', { cancelado: EstadoServicio.CANCELADO });

    if (servicioIdExcluido) {
      qb.andWhere('s.id != :servicioIdExcluido', { servicioIdExcluido });
    }

    const serviciosExistentes = await qb.getMany();

    for (const s of serviciosExistentes) {
      // Hay solapamiento si los rangos [horaInicio, horaFin] se intersectan
      // Condición de no solapamiento: fin <= otro.inicio || inicio >= otro.fin
      const solapado = !(horaFin <= s.horaInicio || horaInicio >= s.horaFinEstimada);
      if (solapado) {
        throw new ConflictException(
          `Conflicto de horario: El vehículo ya tiene asignado el servicio ${s.codigo} el ${fecha} entre ${s.horaInicio} y ${s.horaFinEstimada}`,
        );
      }
    }
  }

  async simularTarifa(dto: SimularTarifaDto) {
    const vehiculo = await this.vehiculoRepo.findOne({
      where: { id: dto.vehiculoId },
      relations: ['camionCarga', 'furgonetaElectrica'],
    });
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo no encontrado`);
    }

    return this.tarifaCalculator.calcularTarifa(
      vehiculo,
      dto.distanciaKm,
      dto.pesoCargaKg,
      dto.recargaPlanificada || false,
    );
  }

  async create(dto: CreateServicioDto, usuarioId?: string): Promise<ServicioTransporte> {
    // Validar código duplicado
    const existente = await this.servicioRepo.findOne({ where: { codigo: dto.codigo } });
    if (existente) {
      throw new ConflictException(`Ya existe un servicio registrado con el código ${dto.codigo}`);
    }

    // Validar cliente
    const cliente = await this.clienteRepo.findOne({ where: { id: dto.clienteId } });
    if (!cliente) {
      throw new NotFoundException(`Cliente no encontrado`);
    }

    // Validar horas
    if (dto.horaInicio >= dto.horaFinEstimada) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora estimada de finalización');
    }

    let tarifaCalculada = 0;
    let costoOperativo = 0;

    // Si viene con vehículo asignado, validar y calcular de forma atómica
    if (dto.vehiculoId) {
      await this.validarSolapamientoHorario(dto.vehiculoId, dto.fecha, dto.horaInicio, dto.horaFinEstimada);
      const vehiculo = await this.vehiculoRepo.findOne({
        where: { id: dto.vehiculoId },
        relations: ['camionCarga', 'furgonetaElectrica'],
      });
      if (!vehiculo) {
        throw new NotFoundException('Vehículo no encontrado');
      }

      const calculo = this.tarifaCalculator.calcularTarifa(
        vehiculo,
        dto.distanciaKm,
        dto.pesoCargaKg,
        dto.recargaPlanificada || false,
      );
      tarifaCalculada = calculo.tarifaFinal;
      costoOperativo = calculo.costoOperativo;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const nuevoServicio = queryRunner.manager.create(ServicioTransporte, {
        codigo: dto.codigo,
        clienteId: dto.clienteId,
        vehiculoId: dto.vehiculoId || null,
        origen: dto.origen,
        destino: dto.destino,
        distanciaKm: dto.distanciaKm,
        pesoCargaKg: dto.pesoCargaKg,
        fecha: dto.fecha,
        horaInicio: dto.horaInicio,
        horaFinEstimada: dto.horaFinEstimada,
        estado: EstadoServicio.PROGRAMADO,
        recargaPlanificada: dto.recargaPlanificada || false,
        tarifaCalculada,
        costoOperativo,
        facturado: false,
      });

      const guardado = await queryRunner.manager.save(ServicioTransporte, nuevoServicio);

      // Registrar auditoría
      const historial = queryRunner.manager.create(HistorialEstado, {
        servicioId: guardado.id,
        estadoAnterior: 'CREACION',
        estadoNuevo: EstadoServicio.PROGRAMADO,
        usuarioId: usuarioId || null,
      });
      await queryRunner.manager.save(HistorialEstado, historial);

      await queryRunner.commitTransaction();
      return this.findOne(guardado.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Asignación concurrente protegida con bloqueo pesimista en base de datos.
   * Regla 11 & Caso crítico del examen.
   */
  async asignarVehiculo(
    servicioId: string,
    dto: AsignarVehiculoDto,
    usuarioId?: string,
  ): Promise<ServicioTransporte> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Bloqueo pesimista sobre el vehículo para serializar asignaciones concurrentes
      const vehiculo = await queryRunner.manager
        .createQueryBuilder(Vehiculo, 'v')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('v.camionCarga', 'c')
        .leftJoinAndSelect('v.furgonetaElectrica', 'f')
        .where('v.id = :id', { id: dto.vehiculoId })
        .getOne();

      if (!vehiculo) {
        throw new NotFoundException('Vehículo no encontrado');
      }

      const servicio = await queryRunner.manager.findOne(ServicioTransporte, {
        where: { id: servicioId },
      });
      if (!servicio) {
        throw new NotFoundException('Servicio de transporte no encontrado');
      }

      if (servicio.estado === EstadoServicio.COMPLETADO || servicio.estado === EstadoServicio.CANCELADO) {
        throw new BadRequestException(`No se puede modificar la asignación de un servicio ${servicio.estado}`);
      }

      // Validar solapamiento de horarios con los servicios ya asignados a este vehículo
      const solapados = await queryRunner.manager
        .createQueryBuilder(ServicioTransporte, 's')
        .where('s.vehiculoId = :vehiculoId', { vehiculoId: vehiculo.id })
        .andWhere('s.fecha = :fecha', { fecha: servicio.fecha })
        .andWhere('s.estado != :cancelado', { cancelado: EstadoServicio.CANCELADO })
        .andWhere('s.id != :servicioId', { servicioId: servicio.id })
        .getMany();

      for (const s of solapados) {
        const haySolape = !(servicio.horaFinEstimada <= s.horaInicio || servicio.horaInicio >= s.horaFinEstimada);
        if (haySolape) {
          throw new ConflictException(
            `El vehículo ya fue asignado concurrentemente al servicio ${s.codigo} en el intervalo ${s.horaInicio} - ${s.horaFinEstimada}`,
          );
        }
      }

      // Recalcular tarifa obligatoriamente en el servidor
      const recarga = dto.recargaPlanificada !== undefined ? dto.recargaPlanificada : servicio.recargaPlanificada;
      const calculo = this.tarifaCalculator.calcularTarifa(
        vehiculo,
        Number(servicio.distanciaKm),
        Number(servicio.pesoCargaKg),
        recarga,
      );

      servicio.vehiculoId = vehiculo.id;
      servicio.recargaPlanificada = recarga;
      servicio.tarifaCalculada = calculo.tarifaFinal;
      servicio.costoOperativo = calculo.costoOperativo;

      await queryRunner.manager.save(ServicioTransporte, servicio);

      // Registrar auditoría de asignación
      const historial = queryRunner.manager.create(HistorialEstado, {
        servicioId: servicio.id,
        estadoAnterior: servicio.estado,
        estadoNuevo: `ASIGNADO_${vehiculo.placa}`,
        usuarioId: usuarioId || null,
      });
      await queryRunner.manager.save(HistorialEstado, historial);

      await queryRunner.commitTransaction();
      return this.findOne(servicio.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Actualización de estados con auditoría y actualización atómica de kilometraje al completar
   * Regla 9 y Regla 10
   */
  async actualizarEstado(
    servicioId: string,
    nuevoEstado: EstadoServicio,
    usuarioId?: string,
  ): Promise<ServicioTransporte> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const servicio = await queryRunner.manager.findOne(ServicioTransporte, {
        where: { id: servicioId },
        relations: ['vehiculo', 'vehiculo.furgonetaElectrica'],
      });

      if (!servicio) {
        throw new NotFoundException('Servicio de transporte no encontrado');
      }

      const estadoAnterior = servicio.estado;

      if (estadoAnterior === nuevoEstado) {
        return servicio;
      }

      if (estadoAnterior === EstadoServicio.COMPLETADO) {
        throw new BadRequestException('Un servicio completado ya no puede cambiar de estado');
      }
      if (estadoAnterior === EstadoServicio.CANCELADO) {
        throw new BadRequestException('Un servicio cancelado no puede reactivarse');
      }

      if (nuevoEstado === EstadoServicio.EN_EJECUCION && !servicio.vehiculoId) {
        throw new BadRequestException('No se puede iniciar un servicio sin tener un vehículo asignado');
      }

      // Regla 9: Actualizar kilometraje exactamente una vez al completar el servicio
      if (nuevoEstado === EstadoServicio.COMPLETADO) {
        if (!servicio.vehiculo) {
          throw new BadRequestException('El servicio no tiene vehículo asignado para registrar kilometraje');
        }

        const vehiculo = await queryRunner.manager.findOne(Vehiculo, {
          where: { id: servicio.vehiculoId },
          relations: ['furgonetaElectrica'],
        });

        if (vehiculo) {
          vehiculo.kilometraje = Number(vehiculo.kilometraje) + Number(servicio.distanciaKm);
          vehiculo.estado = EstadoVehiculo.DISPONIBLE;

          // Si es furgoneta eléctrica, actualizar batería remanente
          if (vehiculo.tipo === TipoVehiculo.FURGONETA_ELECTRICA && vehiculo.furgonetaElectrica) {
            const f = vehiculo.furgonetaElectrica;
            const kwhConsumidos = (Number(servicio.distanciaKm) / 100) * Number(f.consumoKWh100Km);
            const porcentajeGastado = (kwhConsumidos / Number(f.capacidadBateriaKWh)) * 100;
            const nuevoPorcentaje = Math.max(0, Number(f.porcentajeBateria) - porcentajeGastado);
            f.porcentajeBateria = Math.round(nuevoPorcentaje * 100) / 100;
            await queryRunner.manager.save(FurgonetaElectrica, f);
          }

          await queryRunner.manager.save(Vehiculo, vehiculo);
        }
      } else if (nuevoEstado === EstadoServicio.EN_EJECUCION) {
        if (servicio.vehiculoId) {
          await queryRunner.manager.update(Vehiculo, servicio.vehiculoId, {
            estado: EstadoVehiculo.EN_SERVICIO,
          });
        }
      } else if (nuevoEstado === EstadoServicio.CANCELADO) {
        if (servicio.vehiculoId) {
          await queryRunner.manager.update(Vehiculo, servicio.vehiculoId, {
            estado: EstadoVehiculo.DISPONIBLE,
          });
        }
      }

      servicio.estado = nuevoEstado;
      await queryRunner.manager.save(ServicioTransporte, servicio);

      // Regla 10: Auditoría de cambios de estado y usuario responsable
      const historial = queryRunner.manager.create(HistorialEstado, {
        servicioId: servicio.id,
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        usuarioId: usuarioId || null,
      });
      await queryRunner.manager.save(HistorialEstado, historial);

      await queryRunner.commitTransaction();
      return this.findOne(servicio.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    estado?: EstadoServicio,
    clienteId?: string,
    vehiculoId?: string,
    fecha?: string,
  ) {
    const qb = this.servicioRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.cliente', 'c')
      .leftJoinAndSelect('s.vehiculo', 'v')
      .leftJoinAndSelect('v.camionCarga', 'cc')
      .leftJoinAndSelect('v.furgonetaElectrica', 'fe')
      .orderBy('s.createdAt', 'DESC');

    if (estado) qb.andWhere('s.estado = :estado', { estado });
    if (clienteId) qb.andWhere('s.clienteId = :clienteId', { clienteId });
    if (vehiculoId) qb.andWhere('s.vehiculoId = :vehiculoId', { vehiculoId });
    if (fecha) qb.andWhere('s.fecha = :fecha', { fecha });

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async findOne(id: string): Promise<ServicioTransporte> {
    const servicio = await this.servicioRepo.findOne({
      where: { id },
      relations: [
        'cliente',
        'vehiculo',
        'vehiculo.camionCarga',
        'vehiculo.furgonetaElectrica',
        'historialEstados',
        'historialEstados.usuario',
      ],
    });
    if (!servicio) {
      throw new NotFoundException(`Servicio con id ${id} no encontrado`);
    }
    return servicio;
  }
}
