import { Body, Controller, Post } from '@nestjs/common';
import { DeportistasService } from '../services/deportistas.service';
import { CreateDeportistaDto } from '../dto/create-deportista.dto';

@Controller('deportistas')
export class DeportistasController {
  constructor(private readonly deportistasService: DeportistasService) {}

  @Post()
  crearDeportista(@Body() createDeportistaDto: CreateDeportistaDto) {
    return this.deportistasService.create(createDeportistaDto);
  }
}
