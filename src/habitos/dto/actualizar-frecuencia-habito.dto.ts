import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class ActualizarFrecuenciaHabitoDto {
  @ApiProperty({
    description: 'Nueva frecuencia del hábito',
    example: 'semanal',
    maxLength: 50,
  })
  @IsNotEmpty()
  @MaxLength(50)
  frecuencia: string;
}
