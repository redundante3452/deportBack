import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ActualizarParcialRegistroDto {
  @ApiPropertyOptional({
    description: 'Nueva duración de la actividad en minutos (mín. 1)',
    example: 50,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  duracionMinutos?: number;

  @ApiPropertyOptional({
    description: 'Notas adicionales o correcciones de la sesión',
    example: 'Ajuste de ritmo por viento',
  })
  @IsOptional()
  notas?: string;
}
