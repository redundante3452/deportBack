import { PartialType } from '@nestjs/swagger';
import { ReemplazarDeportistaV3Dto } from './reemplazar-deportista-v3.dto';

export class ActualizarParcialDeportistaV3Dto extends PartialType(
  ReemplazarDeportistaV3Dto,
) {}
