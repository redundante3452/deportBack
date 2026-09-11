import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDeportistaDto {
  @ApiProperty({
    description: 'Nombre completo del deportista',
    example: 'Juan Pérez',
    maxLength: 100,
  })
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({
    description: 'Correo electrónico único del deportista',
    example: 'juan.perez@ejemplo.com',
  })
  @IsEmail()
  email: string;
}
