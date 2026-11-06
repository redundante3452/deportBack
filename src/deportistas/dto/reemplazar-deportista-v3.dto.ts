import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ReemplazarDeportistaV3Dto {
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Nivel deportivo opcional incorporado en api/v3.',
    example: 'intermedio',
    maxLength: 50,
  })
  @MaxLength(50)
  nivel?: string | null;
}
