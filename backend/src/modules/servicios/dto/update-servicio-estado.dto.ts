import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoServicio } from '../../../common/enums';

export class UpdateServicioEstadoDto {
  @ApiProperty({ enum: EstadoServicio, example: EstadoServicio.EN_EJECUCION })
  @IsEnum(EstadoServicio, { message: 'Estado del servicio inválido' })
  @IsNotEmpty({ message: 'El nuevo estado es requerido' })
  nuevoEstado: EstadoServicio;
}
