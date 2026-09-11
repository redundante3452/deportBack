import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { DeportistasService } from '../services/deportistas.service';
import { CreateDeportistaDto } from '../dto/create-deportista.dto';
import { ActualizarParcialDeportistaDto } from '../dto/actualizar-parcial-deportista.dto';
import { ReemplazarDeportistaDto } from '../dto/reemplazar-deportista.dto';
import { BuscarDeportistasDto } from '../dto/buscar-deportistas.dto';

@ApiTags('Deportistas')
@Controller('deportistas')
export class DeportistasController {
  constructor(private readonly deportistasService: DeportistasService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo deportista',
    description: 'Registra un deportista en el sistema con su nombre y email.',
  })
  @ApiResponse({ status: 201, description: 'Deportista creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  crearDeportista(@Body() createDeportistaDto: CreateDeportistaDto) {
    return this.deportistasService.create(createDeportistaDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar deportistas',
    description: 'Devuelve todos los deportistas. Permite filtrar por nombre y/o email.',
  })
  @ApiQuery({ name: 'nombre', required: false, description: 'Filtro por nombre del deportista', example: 'Juan' })
  @ApiQuery({ name: 'email', required: false, description: 'Filtro por correo electrónico', example: 'juan@ejemplo.com' })
  @ApiResponse({ status: 200, description: 'Lista de deportistas.' })
  listarDeportistas(
    @Query('nombre') nombre?: string,
    @Query('email') email?: string,
  ) {
    return this.deportistasService.listar(nombre, email);
  }

  @Post('buscar')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Búsqueda avanzada de deportistas (POST)',
    description:
      'Permite buscar deportistas con filtros complejos enviados en el body. Equivalente al método HTTP QUERY en /deportistas.',
  })
  @ApiBody({ type: BuscarDeportistasDto })
  @ApiResponse({ status: 200, description: 'Resultados de la búsqueda.' })
  @ApiResponse({ status: 400, description: 'Filtros inválidos.' })
  buscarAvanzado(@Body() dto: BuscarDeportistasDto) {
    return this.deportistasService.buscarAvanzado(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener deportista por ID' })
  @ApiParam({ name: 'id', description: 'UUID del deportista', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deportista encontrado.' })
  @ApiResponse({ status: 404, description: 'Deportista no encontrado.' })
  buscarPorId(@Param('id') id: string) {
    return this.deportistasService.buscarPorId(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Reemplazar deportista completo (PUT)',
    description: 'Sustituye todos los campos del deportista por los nuevos valores.',
  })
  @ApiParam({ name: 'id', description: 'UUID del deportista', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deportista reemplazado.' })
  @ApiResponse({ status: 404, description: 'Deportista no encontrado.' })
  reemplazar(@Param('id') id: string, @Body() dto: ReemplazarDeportistaDto) {
    return this.deportistasService.reemplazar(id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualización parcial del deportista (PATCH)',
    description: 'Actualiza únicamente los campos proporcionados.',
  })
  @ApiParam({ name: 'id', description: 'UUID del deportista', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deportista actualizado.' })
  @ApiResponse({ status: 404, description: 'Deportista no encontrado.' })
  actualizarParcial(
    @Param('id') id: string,
    @Body() dto: ActualizarParcialDeportistaDto,
  ) {
    return this.deportistasService.actualizarParcial(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar deportista' })
  @ApiParam({ name: 'id', description: 'UUID del deportista', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deportista eliminado.' })
  @ApiResponse({ status: 404, description: 'Deportista no encontrado.' })
  eliminar(@Param('id') id: string) {
    return this.deportistasService.eliminar(id);
  }
}
