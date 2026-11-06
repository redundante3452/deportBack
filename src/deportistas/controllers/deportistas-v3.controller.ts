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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeportistasService } from '../services/deportistas.service';
import { CreateDeportistaV3Dto } from '../dto/create-deportista-v3.dto';
import { ActualizarParcialDeportistaV3Dto } from '../dto/actualizar-parcial-deportista-v3.dto';
import { ReemplazarDeportistaV3Dto } from '../dto/reemplazar-deportista-v3.dto';

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

  @Put(':id')
  @ApiOperation({
    summary: 'Reemplazar deportista completo (v3)',
  })
  reemplazar(
    @Param('id') id: string,
    @Body() dto: ReemplazarDeportistaV3Dto,
  ) {
    return this.deportistasService.reemplazar(id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar deportista parcialmente (v3)',
  })
  actualizarParcial(
    @Param('id') id: string,
    @Body() dto: ActualizarParcialDeportistaV3Dto,
  ) {
    return this.deportistasService.actualizarParcial(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar deportista (v3)',
  })
  eliminar(@Param('id') id: string) {
    return this.deportistasService.eliminar(id);
  }
}
