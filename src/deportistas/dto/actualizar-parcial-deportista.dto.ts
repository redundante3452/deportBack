import { PartialType } from '@nestjs/swagger';
import { ReemplazarDeportistaDto } from './reemplazar-deportista.dto';

export class ActualizarParcialDeportistaDto extends PartialType(
  ReemplazarDeportistaDto,
) {}
