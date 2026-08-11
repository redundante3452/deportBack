import { IsOptional, IsString } from 'class-validator';

export class BuscarDeportistasDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
