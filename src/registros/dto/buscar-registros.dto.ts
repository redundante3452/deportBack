import {
  IsBooleanString,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BuscarRegistrosDto {
  @ApiPropertyOptional({
    description: 'Filtrar por UUID del hábito',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  habitoId?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del rango de búsqueda (ISO 8601)',
    example: '2026-08-01',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del rango de búsqueda (ISO 8601)',
    example: '2026-08-31',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de completado ("true" o "false")',
    example: 'true',
    type: String,
  })
  @IsOptional()
  @IsBooleanString()
  completado?: string;

  @ApiPropertyOptional({
    description: 'Filtrar registros con RPE mayor o igual a este valor',
    example: '6',
    type: String,
  })
  @IsOptional()
  @IsNumberString()
  rpeMin?: string;

  @ApiPropertyOptional({
    description: 'Filtrar registros con duración mínima en minutos',
    example: '30',
    type: String,
  })
  @IsOptional()
  @IsNumberString()
  duracionMinima?: string;
}
