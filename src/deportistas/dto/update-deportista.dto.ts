import { PartialType } from '@nestjs/mapped-types';
import { CreateDeportistaDto } from './create-deportista.dto';

export class UpdateDeportistaDto extends PartialType(CreateDeportistaDto) {}
