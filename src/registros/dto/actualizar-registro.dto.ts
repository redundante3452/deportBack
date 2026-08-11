import {
  IsDateString,
  IsInt,
  IsOptional,
  IsBoolean,
  Max,
  Min,
} from 'class-validator';

export class ActualizarRegistroDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsBoolean()
  completado?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  duracionMinutos?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rpe?: number;

  @IsOptional()
  notas?: string;
}
