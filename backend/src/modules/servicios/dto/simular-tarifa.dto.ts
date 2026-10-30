import { IsString, IsNotEmpty, IsNumber, Min, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SimularTarifaDto {
  @ApiProperty({ example: 'uuid-vehiculo', description: 'ID del vehículo a cotizar' })
  @IsString()
  @IsNotEmpty({ message: 'El vehiculoId es obligatorio' })
  vehiculoId: string;

  @ApiProperty({ example: 150, description: 'Distancia en kilómetros' })
  @IsNumber()
  @Min(0.1, { message: 'La distancia debe ser positiva' })
  distanciaKm: number;

  @ApiProperty({ example: 3000, description: 'Peso de la carga en kilogramos' })
  @IsNumber()
  @Min(0.1, { message: 'El peso debe ser positivo' })
  pesoCargaKg: number;

  @ApiPropertyOptional({ example: false, description: 'Recarga planificada para eléctricas' })
  @IsOptional()
  @IsBoolean()
  recargaPlanificada?: boolean;
}
