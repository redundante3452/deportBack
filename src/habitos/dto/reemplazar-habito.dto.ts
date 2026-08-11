import { IsNotEmpty, IsNumber, IsUUID, MaxLength } from 'class-validator';

export class ReemplazarHabitoDto {
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsNotEmpty()
  @MaxLength(255)
  descripcion: string;

  @IsNotEmpty()
  @MaxLength(50)
  frecuencia: string;

  @IsUUID()
  deportistaId: string;

  @IsNumber()
  rachaActual: number;

  @IsNumber()
  rachaMaxima: number;
}
