import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Vehiculo } from '../../database/entities/vehiculo.entity';
import { CamionCarga } from '../../database/entities/camion-carga.entity';
import { FurgonetaElectrica } from '../../database/entities/furgoneta-electrica.entity';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { TipoVehiculo, EstadoVehiculo } from '../../common/enums';
import { TarifaCalculatorService } from './tarifa-calculator.service';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,
    @InjectRepository(CamionCarga)
    private readonly camionRepo: Repository<CamionCarga>,
    @InjectRepository(FurgonetaElectrica)
    private readonly furgonetaRepo: Repository<FurgonetaElectrica>,
    private readonly tarifaCalculator: TarifaCalculatorService,
  ) {}

  async findAll(search?: string, tipo?: TipoVehiculo, estado?: EstadoVehiculo): Promise<Vehiculo[]> {
    const query = this.vehiculoRepo.createQueryBuilder('v')
      .leftJoinAndSelect('v.camionCarga', 'c')
      .leftJoinAndSelect('v.furgonetaElectrica', 'f')
      .orderBy('v.createdAt', 'DESC');

    if (search) {
      query.andWhere(
        '(LOWER(v.placa) LIKE LOWER(:search) OR LOWER(v.marca) LIKE LOWER(:search) OR LOWER(v.modelo) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }
    if (tipo) {
      query.andWhere('v.tipo = :tipo', { tipo });
    }
    if (estado) {
      query.andWhere('v.estado = :estado', { estado });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoRepo.findOne({
      where: { id },
      relations: ['camionCarga', 'furgonetaElectrica'],
    });
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
    return vehiculo;
  }

  async findByPlaca(placa: string): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoRepo.findOne({
      where: { placa },
      relations: ['camionCarga', 'furgonetaElectrica'],
    });
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con placa ${placa} no encontrado`);
    }
    return vehiculo;
  }

  async create(createDto: CreateVehiculoDto): Promise<Vehiculo> {
    const existe = await this.vehiculoRepo.findOne({ where: { placa: createDto.placa } });
    if (existe) {
      throw new ConflictException(`Ya existe un vehículo registrado con la placa ${createDto.placa}`);
    }

    // Validar sub-especificaciones técnicas según polimorfismo
    if (createDto.tipo === TipoVehiculo.CAMION_CARGA && !createDto.camionCarga) {
      throw new BadRequestException('Debe ingresar los datos técnicos del camión de carga (consumoLitros100Km, precioLitro, numeroEjes, costoMantenimientoKm)');
    }
    if (createDto.tipo === TipoVehiculo.FURGONETA_ELECTRICA && !createDto.furgonetaElectrica) {
      throw new BadRequestException('Debe ingresar los datos técnicos de la furgoneta eléctrica (capacidadBateriaKWh, consumoKWh100Km, costoKWh, autonomiaKm, porcentajeBateria)');
    }

    const nuevoVehiculo = this.vehiculoRepo.create({
      placa: createDto.placa.toUpperCase(),
      marca: createDto.marca,
      modelo: createDto.modelo,
      anio: createDto.anio,
      capacidadCargaKg: createDto.capacidadCargaKg,
      kilometraje: createDto.kilometraje || 0,
      tipo: createDto.tipo,
      estado: createDto.estado || EstadoVehiculo.DISPONIBLE,
      imagenUrl: createDto.imagenUrl,
    });

    const guardado = await this.vehiculoRepo.save(nuevoVehiculo);

    if (createDto.tipo === TipoVehiculo.CAMION_CARGA && createDto.camionCarga) {
      const camion = this.camionRepo.create({
        ...createDto.camionCarga,
        vehiculoId: guardado.id,
      });
      await this.camionRepo.save(camion);
    } else if (createDto.tipo === TipoVehiculo.FURGONETA_ELECTRICA && createDto.furgonetaElectrica) {
      if (createDto.furgonetaElectrica.porcentajeBateria < 0 || createDto.furgonetaElectrica.porcentajeBateria > 100) {
        throw new BadRequestException('El porcentaje de batería debe estar entre 0 y 100%');
      }
      const furgoneta = this.furgonetaRepo.create({
        ...createDto.furgonetaElectrica,
        vehiculoId: guardado.id,
      });
      await this.furgonetaRepo.save(furgoneta);
    }

    return this.findOne(guardado.id);
  }

  async update(id: string, updateDto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);

    if (updateDto.placa && updateDto.placa.toUpperCase() !== vehiculo.placa) {
      const existente = await this.vehiculoRepo.findOne({ where: { placa: updateDto.placa.toUpperCase() } });
      if (existente && existente.id !== id) {
        throw new ConflictException(`Ya existe otro vehículo con la placa ${updateDto.placa}`);
      }
      vehiculo.placa = updateDto.placa.toUpperCase();
    }

    if (updateDto.marca) vehiculo.marca = updateDto.marca;
    if (updateDto.modelo) vehiculo.modelo = updateDto.modelo;
    if (updateDto.anio) vehiculo.anio = updateDto.anio;
    if (updateDto.capacidadCargaKg) vehiculo.capacidadCargaKg = updateDto.capacidadCargaKg;
    if (updateDto.kilometraje !== undefined) vehiculo.kilometraje = updateDto.kilometraje;
    if (updateDto.estado) vehiculo.estado = updateDto.estado;
    if (updateDto.imagenUrl !== undefined) vehiculo.imagenUrl = updateDto.imagenUrl;

    await this.vehiculoRepo.save(vehiculo);

    if (vehiculo.tipo === TipoVehiculo.CAMION_CARGA && updateDto.camionCarga && vehiculo.camionCarga) {
      await this.camionRepo.update(vehiculo.camionCarga.id, updateDto.camionCarga);
    } else if (vehiculo.tipo === TipoVehiculo.FURGONETA_ELECTRICA && updateDto.furgonetaElectrica && vehiculo.furgonetaElectrica) {
      if (
        updateDto.furgonetaElectrica.porcentajeBateria !== undefined &&
        (updateDto.furgonetaElectrica.porcentajeBateria < 0 || updateDto.furgonetaElectrica.porcentajeBateria > 100)
      ) {
        throw new BadRequestException('El porcentaje de batería debe estar entre 0 y 100%');
      }
      await this.furgonetaRepo.update(vehiculo.furgonetaElectrica.id, updateDto.furgonetaElectrica);
    }

    return this.findOne(id);
  }

  async getEficiencia(id: string) {
    const vehiculo = await this.findOne(id);

    if (vehiculo.tipo === TipoVehiculo.CAMION_CARGA) {
      const c = vehiculo.camionCarga;
      // Costo de combustible por cada 1 km = (consumoLitros100Km / 100) * precioLitro
      const costoCombustibleKm = (Number(c.consumoLitros100Km) / 100) * Number(c.precioLitro);
      const costoTotalKm = costoCombustibleKm + Number(c.costoMantenimientoKm);
      // Costo por tonelada-km a plena carga
      const toneladas = Number(vehiculo.capacidadCargaKg) / 1000;
      const costoPorToneladaKm = toneladas > 0 ? costoTotalKm / toneladas : 0;

      return {
        vehiculoId: vehiculo.id,
        placa: vehiculo.placa,
        tipo: vehiculo.tipo,
        metricas: {
          costoCombustibleKm: Math.round(costoCombustibleKm * 1000) / 1000,
          costoTotalKm: Math.round(costoTotalKm * 1000) / 1000,
          costoPorToneladaKm: Math.round(costoPorToneladaKm * 1000) / 1000,
          numeroEjes: c.numeroEjes,
        },
        diagnostico:
          costoTotalKm < 0.35
            ? 'Alta eficiencia operativa en consumo de combustible'
            : 'Consumo moderado; se recomienda revisión de mantenimiento programado',
      };
    } else {
      const f = vehiculo.furgonetaElectrica;
      // Costo energético por km = (consumoKWh100Km / 100) * costoKWh
      const costoEnergiaKm = (Number(f.consumoKWh100Km) / 100) * Number(f.costoKWh);
      const autonomiaDisponible = this.tarifaCalculator.calcularAutonomiaDisponible(
        Number(f.capacidadBateriaKWh),
        Number(f.consumoKWh100Km),
        Number(f.porcentajeBateria),
      );

      return {
        vehiculoId: vehiculo.id,
        placa: vehiculo.placa,
        tipo: vehiculo.tipo,
        metricas: {
          costoEnergiaKm: Math.round(costoEnergiaKm * 1000) / 1000,
          porcentajeBateriaActual: Number(f.porcentajeBateria),
          autonomiaNominalKm: Number(f.autonomiaKm),
          autonomiaDisponibleKm: autonomiaDisponible,
        },
        diagnostico:
          Number(f.porcentajeBateria) >= 50
            ? 'Batería en estado óptimo para asignación inmediata'
            : 'Batería baja; se requiere recarga antes de servicios de media o larga distancia',
      };
    }
  }
}
