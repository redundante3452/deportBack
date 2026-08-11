import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class BuscarRegistrosDto {
  @IsOptional()
  @IsUUID()
  habitoId?: string;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}
