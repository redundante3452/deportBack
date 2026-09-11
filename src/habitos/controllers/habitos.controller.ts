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
import { HabitosService } from '../services/habitos.service';
import { CrearHabitoDto } from '../dto/crear-habito.dto';
import { BuscarHabitosDto } from '../dto/buscar-habitos.dto';
import { ReemplazarHabitoDto } from '../dto/reemplazar-habito.dto';
import { ActualizarFrecuenciaHabitoDto } from '../dto/actualizar-frecuencia-habito.dto';

@ApiTags('Hábitos')
@Controller('habitos')
export class HabitosController {
  constructor(private readonly habitosService: HabitosService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo hábito',
    description: 'Registra un hábito deportivo vinculado a un deportista.',
  })
  @ApiResponse({ status: 201, description: 'Hábito creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  crearHabito(@Body() dto: CrearHabitoDto) {
    return this.habitosService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar hábitos',
    description: 'Devuelve todos los hábitos. Permite filtrar por frecuencia y/o deportistaId.',
  })
  @ApiQuery({ name: 'frecuencia', required: false, description: 'Filtro por frecuencia', example: 'diario' })
  @ApiQuery({ name: 'deportistaId', required: false, description: 'Filtro por UUID de deportista', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lista de hábitos.' })
  listarHabitos(
    @Query('frecuencia') frecuencia?: string,
    @Query('deportistaId') deportistaId?: string,
  ) {
    return this.habitosService.listar(frecuencia, deportistaId);
  }

  @Post('buscar')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Búsqueda avanzada de hábitos (POST)',
    description:
      'Permite buscar hábitos con filtros complejos en el body. Equivalente al método HTTP QUERY en /habitos.',
  })
  @ApiBody({ type: BuscarHabitosDto })
  @ApiResponse({ status: 200, description: 'Resultados de la búsqueda.' })
  @ApiResponse({ status: 400, description: 'Filtros inválidos.' })
  buscarAvanzado(@Body() dto: BuscarHabitosDto) {
    return this.habitosService.buscarAvanzado(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener hábito por ID' })
  @ApiParam({ name: 'id', description: 'UUID del hábito', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Hábito encontrado.' })
  @ApiResponse({ status: 404, description: 'Hábito no encontrado.' })
  buscarPorId(@Param('id') id: string) {
    return this.habitosService.buscarPorId(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Reemplazar hábito completo (PUT)',
    description: 'Sustituye todos los campos del hábito por los nuevos valores.',
  })
  @ApiParam({ name: 'id', description: 'UUID del hábito', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Hábito reemplazado.' })
  @ApiResponse({ status: 404, description: 'Hábito no encontrado.' })
  reemplazar(@Param('id') id: string, @Body() dto: ReemplazarHabitoDto) {
    return this.habitosService.reemplazar(id, dto);
  }

  @Patch(':id/frecuencia')
  @ApiOperation({
    summary: 'Actualizar frecuencia del hábito (PATCH)',
    description: 'Actualiza únicamente la frecuencia del hábito.',
  })
  @ApiParam({ name: 'id', description: 'UUID del hábito', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Frecuencia actualizada.' })
  @ApiResponse({ status: 404, description: 'Hábito no encontrado.' })
  actualizarFrecuencia(
    @Param('id') id: string,
    @Body() dto: ActualizarFrecuenciaHabitoDto,
  ) {
    return this.habitosService.actualizarFrecuencia(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar hábito' })
  @ApiParam({ name: 'id', description: 'UUID del hábito', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Hábito eliminado.' })
  @ApiResponse({ status: 404, description: 'Hábito no encontrado.' })
  eliminar(@Param('id') id: string) {
    return this.habitosService.eliminar(id);
  }
}
