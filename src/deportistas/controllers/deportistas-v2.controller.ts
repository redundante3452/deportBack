import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { DeportistasService } from '../services/deportistas.service';
import { CreateDeportistaDto } from '../dto/create-deportista.dto';
import { BuscarDeportistasDto } from '../dto/buscar-deportistas.dto';
import { ReemplazarDeportistaDto } from '../dto/reemplazar-deportista.dto';
import { ActualizarParcialDeportistaDto } from '../dto/actualizar-parcial-deportista.dto';
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

  @Post('buscar')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Búsqueda avanzada de deportistas (v2, POST)',
    description:
      'Igual que POST /deportistas/buscar, con la respuesta envuelta con el trace_id. Equivalente al método HTTP QUERY en /api/v2/deportistas.',
  })
  @ApiBody({ type: BuscarDeportistasDto })
  @ApiResponse({ status: 200, description: 'Resultados de la búsqueda.' })
  @ApiResponse({ status: 400, description: 'Filtros inválidos.' })
  async buscarAvanzado(
    @Body() dto: BuscarDeportistasDto,
    @Req() request: RequestConTraceId,
  ) {
    const deportistas = await this.deportistasService.buscarAvanzado(dto);
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

  @Put(':id')
  @ApiOperation({
    summary: 'Reemplazar deportista completo (v2, PUT)',
    description:
      'Sustituye todos los campos del deportista. Los cambios se reflejan de inmediato en GET /api/v2/deportistas/:id (los datos propios nunca se cachean).',
  })
  @ApiParam({ name: 'id', description: 'UUID del deportista', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deportista reemplazado.' })
  @ApiResponse({ status: 404, description: 'Deportista no encontrado.' })
  async reemplazar(
    @Param('id') id: string,
    @Body() dto: ReemplazarDeportistaDto,
    @Req() request: RequestConTraceId,
  ) {
    const deportista = await this.deportistasService.reemplazar(id, dto);
    return { deportista, trace_id: obtenerTraceId(request) };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualización parcial del deportista (v2, PATCH)',
    description:
      'Actualiza únicamente los campos enviados. Sirve para modificar en tiempo real el objeto que el flujo va agregando al mensaje: el cambio se ve de inmediato en GET /api/v2/deportistas/:id.',
  })
  @ApiParam({ name: 'id', description: 'UUID del deportista', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deportista actualizado.' })
  @ApiResponse({ status: 404, description: 'Deportista no encontrado.' })
  async actualizarParcial(
    @Param('id') id: string,
    @Body() dto: ActualizarParcialDeportistaDto,
    @Req() request: RequestConTraceId,
  ) {
    const deportista = await this.deportistasService.actualizarParcial(id, dto);
    return { deportista, trace_id: obtenerTraceId(request) };
  }
}
