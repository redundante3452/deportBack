import {
  IsBooleanString,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsUUID,
} from 'class-validator';

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

  @IsOptional()
  @IsBooleanString()
  completado?: string;

  @IsOptional()
  @IsNumberString()
  rpeMin?: string;

  @IsOptional()
  @IsNumberString()
  duracionMinima?: string;
}
