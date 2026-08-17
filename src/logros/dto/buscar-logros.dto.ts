import { IsOptional, IsUUID } from 'class-validator';

export class BuscarLogrosDto {
  @IsOptional()
  @IsUUID()
  habitoId?: string;

  @IsOptional()
  @IsUUID()
  deportistaId?: string;
}
