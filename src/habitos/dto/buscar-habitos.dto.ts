import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class BuscarHabitosDto {
  @IsOptional()
  @IsString()
  frecuencia?: string;

  @IsOptional()
  @IsUUID()
  deportistaId?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsNumber()
  rachaActual?: number;
}
