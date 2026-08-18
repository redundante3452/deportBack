import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { BuscarLogrosDto } from '../dto/buscar-logros.dto';
import { LogrosService } from '../services/logros.service';

@ApiTags('Logros')
@Controller('logros')
export class LogrosController {
  constructor(private readonly logrosService: LogrosService) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar logros',
    description:
      'Devuelve los logros desbloqueados. Puede filtrarse por hábito y/o por deportista.',
  })
  @ApiResponse({ status: 200, description: 'Lista de logros.' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos.' })
  buscar(@Query() dto: BuscarLogrosDto) {
    return this.logrosService.buscar(dto);
  }
}
