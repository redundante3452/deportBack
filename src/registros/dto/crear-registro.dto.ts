import { IsDateString, IsInt, IsUUID, Max, Min } from 'class-validator';

export class CrearRegistroDto {
  @IsUUID()
  habitoId: string;

  @IsDateString()
  fecha: string;

  @IsInt()
  @Min(1)
  duracionMinutos: number;

  @IsInt()
  @Min(1)
  @Max(10)
  rpe: number;
}
