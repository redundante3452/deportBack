import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { DeportistasService } from '../services/deportistas.service';
import { CreateDeportistaDto } from '../dto/create-deportista.dto';
import { obtenerTraceId } from '../../common/trace-id/trace-id.util';
import type { RequestConTraceId } from '../../common/trace-id/trace-id.util';

@ApiTags('Deportistas v2')
@Controller('api/v2/deportistas')
export class DeportistasV2Controller {
  constructor(private readonly deportistasService: DeportistasService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un deportista (v2)',
    description:
      'Igual que POST /deportistas, pero la respuesta viene envuelta con el trace_id de la petición.',
  })
  @ApiResponse({ status: 201, description: 'Deportista creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado.' })
  async crear(
    @Body() dto: CreateDeportistaDto,
    @Req() request: RequestConTraceId,
  ) {
    const deportista = await this.deportistasService.create(dto);
    return { deportista, trace_id: obtenerTraceId(request) };
  }

  @Get()
  @ApiOperation({
    summary: 'Listar deportistas (v2)',
    description:
      'Igual que GET /deportistas, con la respuesta envuelta con el trace_id. Las entidades de las otras 2 APIs se piden por id (GET /api/v2/deportistas/:id), no en el listado.',
  })
  @ApiQuery({
    name: 'nombre',
    required: false,
    description: 'Filtro por nombre del deportista',
    example: 'Juan',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Filtro por correo electrónico',
    example: 'juan@ejemplo.com',
  })
  @ApiResponse({ status: 200, description: 'Lista de deportistas.' })
  async listar(
    @Req() request: RequestConTraceId,
    @Query('nombre') nombre?: string,
    @Query('email') email?: string,
  ) {
    const deportistas = await this.deportistasService.listar(nombre, email);
    return { deportistas, trace_id: obtenerTraceId(request) };
  }

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
