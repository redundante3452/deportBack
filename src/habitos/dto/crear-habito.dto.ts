import { IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class CrearHabitoDto {
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
}
