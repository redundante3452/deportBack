import {
  IsDateString,
  IsInt,
  IsOptional,
  IsBoolean,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarRegistroDto {
  @ApiPropertyOptional({
    description: 'Nueva fecha de la actividad (ISO 8601)',
    example: '2026-08-20',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({
    description: 'Indica si el hábito fue completado',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  completado?: boolean;

  @ApiPropertyOptional({
    description: 'Duración actualizada en minutos (mín. 1)',
    example: 60,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  duracionMinutos?: number;

  @ApiPropertyOptional({
    description: 'Nuevo nivel de esfuerzo percibido (RPE) del 1 al 10',
    example: 8,
    minimum: 1,
    maximum: 10,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rpe?: number;

  @ApiPropertyOptional({
    description: 'Notas adicionales actualizadas',
    example: 'Buen ritmo cardio',
  })
  @IsOptional()
  notas?: string;
}
