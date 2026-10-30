import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@translogic.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo debe ser una dirección de email válida' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;

  @ApiProperty({ example: 'Admin123!', description: 'Contraseña del usuario' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
