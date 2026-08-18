import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, MaxLength } from 'class-validator';

export class ReemplazarHabitoDto {
  @ApiProperty({
    description: 'Nombre del hábito deportivo',
    example: 'Correr 5km',
    maxLength: 100,
  })
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({
    description: 'Descripción detallada del hábito',
    example: 'Salir a correr 5 kilómetros cada mañana a ritmo moderado',
    maxLength: 255,
  })
  @IsNotEmpty()
  @MaxLength(255)
  descripcion: string;

  @ApiProperty({
    description: 'Frecuencia del hábito',
    example: 'diario',
    maxLength: 50,
  })
  @IsNotEmpty()
  @MaxLength(50)
  frecuencia: string;

  @ApiProperty({
    description: 'UUID del deportista dueño de este hábito',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  deportistaId: string;

  @ApiProperty({
    description: 'Racha actual de días consecutivos completados',
    example: 14,
    type: Number,
  })
  @IsNumber()
  rachaActual: number;

  @ApiProperty({
    description: 'Racha máxima histórica de días consecutivos',
    example: 30,
    type: Number,
  })
  @IsNumber()
  rachaMaxima: number;
}
