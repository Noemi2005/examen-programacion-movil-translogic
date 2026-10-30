import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { VehiculosModule } from './modules/vehiculos/vehiculos.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ServiciosModule } from './modules/servicios/servicios.module';
import { FacturasModule } from './modules/facturas/facturas.module';
import { ReportesModule } from './modules/reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    VehiculosModule,
    ClientesModule,
    ServiciosModule,
    FacturasModule,
    ReportesModule,
  ],
})
export class AppModule {}
