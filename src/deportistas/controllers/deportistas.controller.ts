import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DeportistasService } from '../services/deportistas.service';
import { CreateDeportistaDto } from '../dto/create-deportista.dto';
import { ActualizarParcialDeportistaDto } from '../dto/actualizar-parcial-deportista.dto';
import { ReemplazarDeportistaDto } from '../dto/reemplazar-deportista.dto';
import { BuscarDeportistasDto } from '../dto/buscar-deportistas.dto';

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

  @Post('buscar')
  buscarAvanzado(@Body() dto: BuscarDeportistasDto) {
    return this.deportistasService.buscarAvanzado(dto);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.deportistasService.buscarPorId(id);
  }

  @Put(':id')
  reemplazar(@Param('id') id: string, @Body() dto: ReemplazarDeportistaDto) {
    return this.deportistasService.reemplazar(id, dto);
  }

  @Patch(':id')
  actualizarParcial(
    @Param('id') id: string,
    @Body() dto: ActualizarParcialDeportistaDto,
  ) {
    return this.deportistasService.actualizarParcial(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.deportistasService.eliminar(id);
  }
}
