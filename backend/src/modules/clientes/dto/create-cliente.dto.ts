import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty({ example: '1790011223001', description: 'RUC o Cédula de Identidad' })
  @IsString()
  @IsNotEmpty({ message: 'La identificación es requerida' })
  identificacion: string;

  @ApiProperty({ example: 'Empresa Logística S.A.', description: 'Razón Social o Nombre del Cliente' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiProperty({ example: 'contacto@empresa.com', description: 'Correo electrónico' })
  @IsEmail({}, { message: 'Formato de correo electrónico inválido' })
  correo: string;

  @ApiProperty({ example: '0991234567', description: 'Número telefónico de contacto' })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  telefono: string;
}
