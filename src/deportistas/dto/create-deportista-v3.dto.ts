import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, MaxLength } from 'class-validator';
import { CreateDeportistaDto } from './create-deportista.dto';

export class CreateDeportistaV3Dto extends CreateDeportistaDto {
  @ApiPropertyOptional({
    description: 'Nivel deportivo opcional incorporado en api/v3.',
    example: 'intermedio',
    maxLength: 50,
  })
  @IsOptional()
  @MaxLength(50)
  nivel?: string;
}
