import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearRegistroDto {
  @ApiProperty({
    description: 'UUID del hábito al que pertenece este registro',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  habitoId: string;

  @ApiProperty({
    description: 'Fecha en que se realizó la actividad (ISO 8601)',
    example: '2026-08-18',
    type: String,
    format: 'date',
  })
  @IsDateString()
  fecha: string;

  @ApiProperty({
    description: 'Indica si el hábito fue completado en su totalidad',
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  completado: boolean;

  @ApiProperty({
    description: 'Duración de la actividad en minutos (mín. 1)',
    example: 45,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  duracionMinutos: number;

  @ApiProperty({
    description: 'Nivel de esfuerzo percibido (RPE) del 1 al 10',
    example: 7,
    minimum: 1,
    maximum: 10,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  rpe: number;

  @ApiPropertyOptional({
    description: 'Notas adicionales sobre la sesión',
    example: 'Mejor ritmo que ayer, sin fatiga muscular',
  })
  @IsOptional()
  notas?: string;
}
