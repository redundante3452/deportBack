import { IsBoolean, IsDateString, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CrearRegistroDto {
  @IsUUID()
  habitoId: string;

  @IsDateString()
  fecha: string;

  @IsBoolean()
  completado: boolean;

  @IsInt()
  @Min(1)
  duracionMinutos: number;

  @IsInt()
  @Min(1)
  @Max(10)
  rpe: number;

  @IsOptional()
  notas?: string;
}
