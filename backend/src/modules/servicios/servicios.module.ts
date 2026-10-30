import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiciosService } from './servicios.service';
import { ServiciosController } from './servicios.controller';
import { ServicioTransporte } from '../../database/entities/servicio-transporte.entity';
import { Vehiculo } from '../../database/entities/vehiculo.entity';
import { Cliente } from '../../database/entities/cliente.entity';
import { HistorialEstado } from '../../database/entities/historial-estado.entity';
import { VehiculosModule } from '../vehiculos/vehiculos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServicioTransporte, Vehiculo, Cliente, HistorialEstado]),
    VehiculosModule,
  ],
  controllers: [ServiciosController],
  providers: [ServiciosService],
  exports: [ServiciosService],
})
export class ServiciosModule {}
