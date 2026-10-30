import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoVehiculo, EstadoVehiculo } from '../../../common/enums';

export class CamionCargaDto {
  @ApiProperty({ example: 25.5, description: 'Consumo en litros por cada 100 km' })
  @IsNumber({}, { message: 'El consumo de litros debe ser numérico' })
  @Min(1)
  consumoLitros100Km: number;

  @ApiProperty({ example: 0.75, description: 'Precio del litro de combustible en USD' })
  @IsNumber({}, { message: 'El precio por litro debe ser numérico' })
  @Min(0.01)
  precioLitro: number;

  @ApiProperty({ example: 3, description: 'Número de ejes del camión' })
  @IsNumber({}, { message: 'El número de ejes debe ser numérico' })
  @Min(2)
  numeroEjes: number;

  @ApiProperty({ example: 0.12, description: 'Costo de mantenimiento por km en USD' })
  @IsNumber({}, { message: 'El costo de mantenimiento debe ser numérico' })
  @Min(0)
  costoMantenimientoKm: number;
}

export class FurgonetaElectricaDto {
  @ApiProperty({ example: 80, description: 'Capacidad nominal de batería en kWh' })
  @IsNumber({}, { message: 'La capacidad de batería debe ser numérica' })
  @Min(1)
  capacidadBateriaKWh: number;

  @ApiProperty({ example: 22.5, description: 'Consumo en kWh por cada 100 km' })
  @IsNumber({}, { message: 'El consumo en kWh debe ser numérico' })
  @Min(1)
  consumoKWh100Km: number;

  @ApiProperty({ example: 0.09, description: 'Costo del kWh en USD' })
  @IsNumber({}, { message: 'El costo por kWh debe ser numérico' })
  @Min(0.01)
  costoKWh: number;

  @ApiProperty({ example: 350, description: 'Autonomía nominal técnica en km' })
  @IsNumber({}, { message: 'La autonomía debe ser numérica' })
  @Min(1)
  autonomiaKm: number;

  @ApiProperty({ example: 95, description: 'Porcentaje actual de carga de batería (0 - 100%)' })
  @IsNumber({}, { message: 'El porcentaje de batería debe ser numérico' })
  @Min(0, { message: 'La batería no puede ser menor al 0%' })
  @Max(100, { message: 'La batería no puede ser mayor al 100%' })
  porcentajeBateria: number;
}

export class CreateVehiculoDto {
  @ApiProperty({ example: 'PBA-9876', description: 'Placa única del vehículo' })
  @IsString()
  @IsNotEmpty({ message: 'La placa es obligatoria' })
  placa: string;

  @ApiProperty({ example: 'Hino', description: 'Marca del fabricante' })
  @IsString()
  @IsNotEmpty({ message: 'La marca es obligatoria' })
  marca: string;

  @ApiProperty({ example: 'GH 1826', description: 'Modelo del vehículo' })
  @IsString()
  @IsNotEmpty({ message: 'El modelo es obligatorio' })
  modelo: string;

  @ApiProperty({ example: 2023, description: 'Año de fabricación' })
  @IsNumber()
  @Min(1990)
  anio: number;

  @ApiProperty({ example: 12000, description: 'Capacidad máxima de carga autorizada en Kg' })
  @IsNumber()
  @Min(1, { message: 'La capacidad de carga debe ser mayor a 0 kg' })
  capacidadCargaKg: number;

  @ApiPropertyOptional({ example: 15000, description: 'Kilometraje acumulado actual' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kilometraje?: number;

  @ApiProperty({ enum: TipoVehiculo, example: TipoVehiculo.CAMION_CARGA })
  @IsEnum(TipoVehiculo, { message: 'Tipo de vehículo inválido' })
  tipo: TipoVehiculo;

  @ApiPropertyOptional({ enum: EstadoVehiculo, default: EstadoVehiculo.DISPONIBLE })
  @IsOptional()
  @IsEnum(EstadoVehiculo)
  estado?: EstadoVehiculo;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...', description: 'URL de la fotografía del vehículo o base64' })
  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @ApiPropertyOptional({ type: CamionCargaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CamionCargaDto)
  camionCarga?: CamionCargaDto;

  @ApiPropertyOptional({ type: FurgonetaElectricaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FurgonetaElectricaDto)
  furgonetaElectrica?: FurgonetaElectricaDto;
}
