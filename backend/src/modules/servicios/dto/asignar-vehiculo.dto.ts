import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsignarVehiculoDto {
  @ApiProperty({ example: 'uuid-vehiculo', description: 'ID del vehículo a asignar' })
  @IsString()
  @IsNotEmpty({ message: 'El vehiculoId es obligatorio' })
  vehiculoId: string;

  @ApiPropertyOptional({ example: false, description: 'Registrar si se planifica recarga para eléctricas' })
  @IsOptional()
  @IsBoolean()
  recargaPlanificada?: boolean;
}
