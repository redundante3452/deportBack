import { IsInt, IsOptional, Min } from 'class-validator';

export class ActualizarParcialRegistroDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  duracionMinutos?: number;

  @IsOptional()
  notas?: string;
}
