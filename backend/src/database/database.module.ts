import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Usuario,
  Cliente,
  Vehiculo,
  CamionCarga,
  FurgonetaElectrica,
  ServicioTransporte,
  HistorialEstado,
  Factura,
  DetalleFactura,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'translogic_db'),
        entities: [
          Usuario,
          Cliente,
          Vehiculo,
          CamionCarga,
          FurgonetaElectrica,
          ServicioTransporte,
          HistorialEstado,
          Factura,
          DetalleFactura,
        ],
        synchronize: true, // Automate schema evolution for development
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
