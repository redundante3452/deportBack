import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDeportistaDto {
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsEmail()
  email: string;
}
