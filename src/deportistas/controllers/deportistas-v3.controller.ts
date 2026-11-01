import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeportistasService } from '../services/deportistas.service';
import { CreateDeportistaV3Dto } from '../dto/create-deportista-v3.dto';

@ApiTags('Deportistas v3 Canary')
@Controller('api/v3/deportistas')
export class DeportistasV3Controller {
  constructor(private readonly deportistasService: DeportistasService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear deportista con nivel deportivo (v3)',
    description:
      'Cambio funcional canary compatible: nivel es opcional y no rompe api/v2.',
  })
  crear(@Body() dto: CreateDeportistaV3Dto) {
    return this.deportistasService.create(dto).then((deportista) => {
      console.log(
        JSON.stringify({
          event: 'deportista_created',
          app_version: process.env.APP_VERSION ?? 'v2',
          app_track: process.env.APP_TRACK ?? 'stable',
        }),
      );
      return deportista;
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar deportistas con nivel deportivo (v3)',
  })
  listar(@Query('nombre') nombre?: string, @Query('email') email?: string) {
    return this.deportistasService.listar(nombre, email);
  }
}
