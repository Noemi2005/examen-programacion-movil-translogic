import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { TarifaCalculatorService } from './tarifa-calculator.service';
import { Vehiculo } from '../../database/entities/vehiculo.entity';
import { CamionCarga } from '../../database/entities/camion-carga.entity';
import { FurgonetaElectrica } from '../../database/entities/furgoneta-electrica.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo, CamionCarga, FurgonetaElectrica])],
  controllers: [VehiculosController],
  providers: [VehiculosService, TarifaCalculatorService],
  exports: [VehiculosService, TarifaCalculatorService],
})
export class VehiculosModule {}
