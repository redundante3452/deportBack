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
import { HabitosService } from '../services/habitos.service';
import { CrearHabitoDto } from '../dto/crear-habito.dto';
import { BuscarHabitosDto } from '../dto/buscar-habitos.dto';
import { ReemplazarHabitoDto } from '../dto/reemplazar-habito.dto';
import { ActualizarFrecuenciaHabitoDto } from '../dto/actualizar-frecuencia-habito.dto';

@Controller('habitos')
export class HabitosController {
  constructor(private readonly habitosService: HabitosService) {}

  @Post()
  crearHabito(@Body() dto: CrearHabitoDto) {
    return this.habitosService.create(dto);
  }

  @Get()
  listarHabitos(
    @Query('frecuencia') frecuencia?: string,
    @Query('deportistaId') deportistaId?: string,
  ) {
    return this.habitosService.listar(frecuencia, deportistaId);
  }

  @Post('buscar')
  buscarAvanzado(@Body() dto: BuscarHabitosDto) {
    return this.habitosService.buscarAvanzado(dto);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.habitosService.buscarPorId(id);
  }

  @Put(':id')
  reemplazar(@Param('id') id: string, @Body() dto: ReemplazarHabitoDto) {
    return this.habitosService.reemplazar(id, dto);
  }

  @Patch(':id/frecuencia')
  actualizarFrecuencia(
    @Param('id') id: string,
    @Body() dto: ActualizarFrecuenciaHabitoDto,
  ) {
    return this.habitosService.actualizarFrecuencia(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.habitosService.eliminar(id);
  }
}
