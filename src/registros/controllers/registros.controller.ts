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
import { RegistrosService } from '../services/registros.service';
import { CrearRegistroDto } from '../dto/crear-registro.dto';
import { BuscarRegistrosDto } from '../dto/buscar-registros.dto';
import { ActualizarRegistroDto } from '../dto/actualizar-registro.dto';
import { ActualizarParcialRegistroDto } from '../dto/actualizar-parcial-registro.dto';

@Controller('registros')
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}

  @Post()
  crearRegistro(@Body() dto: CrearRegistroDto) {
    return this.registrosService.create(dto);
  }

  @Get()
  historial(@Query() dto: BuscarRegistrosDto) {
    return this.registrosService.historial(dto);
  }

  @Get(':id')
  detalle(@Param('id') id: string) {
    return this.registrosService.buscarPorId(id);
  }

  @Put(':id')
  actualizarCompleto(
    @Param('id') id: string,
    @Body() dto: ActualizarRegistroDto,
  ) {
    return this.registrosService.actualizarCompleto(id, dto);
  }

  @Patch(':id')
  actualizarParcial(
    @Param('id') id: string,
    @Body() dto: ActualizarParcialRegistroDto,
  ) {
    return this.registrosService.actualizarParcial(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.registrosService.eliminar(id);
  }
}
