import { PartialType } from '@nestjs/swagger';
import { ReemplazarDeportistaDto } from './reemplazar-deportista.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class ActualizarParcialDeportistaDto extends PartialType(
  ReemplazarDeportistaDto,
) {}
