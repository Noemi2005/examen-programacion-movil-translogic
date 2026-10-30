import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFacturaDto {
  @ApiProperty({ example: 'uuid-cliente', description: 'ID del cliente a facturar' })
  @IsString()
  @IsNotEmpty({ message: 'El clienteId es obligatorio' })
  clienteId: string;

  @ApiProperty({
    example: ['uuid-servicio-1', 'uuid-servicio-2'],
    description: 'Lista de IDs de servicios completados a facturar',
  })
  @IsArray({ message: 'Los servicios deben ser una lista' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un servicio para facturar' })
  serviciosIds: string[];

  @ApiPropertyOptional({ example: 'FAC-2026-001', description: 'Código de factura (autogenerado si no se provee)' })
  @IsOptional()
  @IsString()
  codigo?: string;
}
