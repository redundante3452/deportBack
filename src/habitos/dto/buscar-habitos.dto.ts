import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class BuscarHabitosDto {
  @ApiPropertyOptional({
    description: 'Filtrar por frecuencia del hábito',
    example: 'diario',
  })
  @IsOptional()
  @IsString()
  frecuencia?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por UUID del deportista',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  deportistaId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por nombre del hábito (búsqueda parcial)',
    example: 'Correr',
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por racha actual mínima',
    example: 7,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  rachaActual?: number;
}
