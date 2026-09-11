import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BuscarDeportistasDto {
  @ApiPropertyOptional({
    description: 'Filtrar por nombre del deportista (búsqueda parcial)',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por correo electrónico del deportista',
    example: 'juan@ejemplo.com',
  })
  @IsOptional()
  @IsString()
  email?: string;
}
