import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturasService } from './facturas.service';
import { FacturasController } from './facturas.controller';
import { PdfGeneratorService } from './pdf-generator.service';
import { Factura } from '../../database/entities/factura.entity';
import { DetalleFactura } from '../../database/entities/detalle-factura.entity';
import { ServicioTransporte } from '../../database/entities/servicio-transporte.entity';
import { Cliente } from '../../database/entities/cliente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Factura, DetalleFactura, ServicioTransporte, Cliente])],
  controllers: [FacturasController],
  providers: [FacturasService, PdfGeneratorService],
  exports: [FacturasService],
})
export class FacturasModule {}
