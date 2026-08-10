import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DeportistasService } from '../services/deportistas.service';
import { CreateDeportistaDto } from '../dto/create-deportista.dto';

@Controller('deportistas')
export class DeportistasController {
  constructor(private readonly deportistasService: DeportistasService) {}

  @Post()
  crearDeportista(@Body() createDeportistaDto: CreateDeportistaDto) {
    return this.deportistasService.create(createDeportistaDto);
  }

  @Get()
  listarDeportistas(
    @Query('nombre') nombre?: string,
    @Query('email') email?: string,
  ) {
    return this.deportistasService.listar(nombre, email);
  }
}
