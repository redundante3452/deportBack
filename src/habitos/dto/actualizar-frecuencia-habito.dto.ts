import { IsNotEmpty, MaxLength } from 'class-validator';

export class ActualizarFrecuenciaHabitoDto {
  @IsNotEmpty()
  @MaxLength(50)
  frecuencia: string;
}
