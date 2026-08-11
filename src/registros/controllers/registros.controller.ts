import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RegistrosService } from '../services/registros.service';
import { CrearRegistroDto } from '../dto/crear-registro.dto';
import { BuscarRegistrosDto } from '../dto/buscar-registros.dto';

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
}
