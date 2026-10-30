import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsBoolean,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServicioDto {
  @ApiProperty({ example: 'SRV-2026-002', description: 'Código único de servicio' })
  @IsString()
  @IsNotEmpty({ message: 'El código de servicio es obligatorio' })
  codigo: string;

  @ApiProperty({ example: 'uuid-cliente', description: 'ID del cliente solicitante' })
  @IsString()
  @IsNotEmpty({ message: 'El clienteId es obligatorio' })
  clienteId: string;

  @ApiPropertyOptional({ example: 'uuid-vehiculo', description: 'ID del vehículo asignado' })
  @IsOptional()
  @IsString()
  vehiculoId?: string;

  @ApiProperty({ example: 'Quito Norte', description: 'Origen del transporte' })
  @IsString()
  @IsNotEmpty({ message: 'El origen es obligatorio' })
  origen: string;

  @ApiProperty({ example: 'Ambato Centro', description: 'Destino del transporte' })
  @IsString()
  @IsNotEmpty({ message: 'El destino es obligatorio' })
  destino: string;

  @ApiProperty({ example: 140.5, description: 'Distancia en kilómetros (debe ser positiva)' })
  @IsNumber({}, { message: 'La distancia debe ser numérica' })
  @Min(0.1, { message: 'La distancia debe ser mayor a 0 km' })
  distanciaKm: number;

  @ApiProperty({ example: 4500, description: 'Peso de la carga en kilogramos' })
  @IsNumber({}, { message: 'El peso debe ser numérico' })
  @Min(0.1, { message: 'El peso debe ser mayor a 0 kg' })
  pesoCargaKg: number;

  @ApiProperty({ example: '2026-11-05', description: 'Fecha del servicio (YYYY-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  fecha: string;

  @ApiProperty({ example: '08:00', description: 'Hora de inicio programada (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'La hora de inicio debe tener formato HH:mm' })
  horaInicio: string;

  @ApiProperty({ example: '12:30', description: 'Hora estimada de finalización (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'La hora de finalización debe tener formato HH:mm' })
  horaFinEstimada: string;

  @ApiPropertyOptional({ example: false, description: 'Indica si se registró recarga planificada' })
  @IsOptional()
  @IsBoolean()
  recargaPlanificada?: boolean;
}
