import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { DeportistasService } from '../services/deportistas.service';
import { obtenerTraceId } from '../../common/trace-id/trace-id.util';
import type { RequestConTraceId } from '../../common/trace-id/trace-id.util';

@ApiTags('Deportistas v2')
@Controller('api/v2/deportistas')
export class DeportistasV2Controller {
  constructor(private readonly deportistasService: DeportistasService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener deportista por ID (v2)',
    description:
      'Igual que GET /deportistas/:id, pero además trae pegada la respuesta cruda de api-fastify (/articulos) e Inventario-U (/skus) en apis_externas. Propaga X-Trace-Id hacia ambas.',
  })
  @ApiParam({ name: 'id', description: 'UUID del deportista', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Deportista encontrado, con apis_externas.',
  })
  @ApiResponse({ status: 404, description: 'Deportista no encontrado.' })
  async obtenerPorId(
    @Param('id') id: string,
    @Req() request: RequestConTraceId,
  ) {
    const traceId = obtenerTraceId(request);

    const [deportista, apisExternas] = await Promise.all([
      this.deportistasService.buscarPorId(id),
      this.deportistasService.obtenerApisExternas(traceId),
    ]);

    return { deportista, apis_externas: apisExternas, trace_id: traceId };
  }
}
