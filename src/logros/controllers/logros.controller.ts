import { Controller, Get, Query } from '@nestjs/common';
import { BuscarLogrosDto } from '../dto/buscar-logros.dto';
import { LogrosService } from '../services/logros.service';

@Controller('logros')
export class LogrosController {
  constructor(private readonly logrosService: LogrosService) {}

  @Get()
  buscar(@Query() dto: BuscarLogrosDto) {
    return this.logrosService.buscar(dto);
  }
}
