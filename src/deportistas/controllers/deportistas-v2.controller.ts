import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { DeportistasService } from '../services/deportistas.service';

@ApiTags('Deportistas v2')
@Controller('api/v2/deportistas')
export class DeportistasV2Controller {
  constructor(private readonly deportistasService: DeportistasService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener deportista por ID (v2)',
    description:
      'Igual que GET /deportistas/:id, pero además trae pegada la respuesta cruda de api-fastify (/articulos) e Inventario-U (/skus) en apis_externas.',
  })
  @ApiParam({ name: 'id', description: 'UUID del deportista', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Deportista encontrado, con apis_externas.',
  })
  @ApiResponse({ status: 404, description: 'Deportista no encontrado.' })
  async obtenerPorId(@Param('id') id: string) {
    const [deportista, apisExternas] = await Promise.all([
      this.deportistasService.buscarPorId(id),
      this.deportistasService.obtenerApisExternas(),
    ]);

    return { deportista, apis_externas: apisExternas };
  }
}
