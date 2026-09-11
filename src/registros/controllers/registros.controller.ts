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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RegistrosService } from '../services/registros.service';
import { CrearRegistroDto } from '../dto/crear-registro.dto';
import { BuscarRegistrosDto } from '../dto/buscar-registros.dto';
import { ActualizarRegistroDto } from '../dto/actualizar-registro.dto';
import { ActualizarParcialRegistroDto } from '../dto/actualizar-parcial-registro.dto';

@ApiTags('Registros de entrenamiento')
@Controller('registros')
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un registro de entrenamiento',
    description: 'Registra una sesión de entrenamiento para un hábito específico.',
  })
  @ApiResponse({ status: 201, description: 'Registro creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  crearRegistro(@Body() dto: CrearRegistroDto) {
    return this.registrosService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Historial de registros',
    description: 'Devuelve el historial de registros de entrenamiento con filtros opcionales.',
  })
  @ApiResponse({ status: 200, description: 'Historial de registros.' })
  historial(@Query() dto: BuscarRegistrosDto) {
    return this.registrosService.historial(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un registro por ID' })
  @ApiParam({ name: 'id', description: 'UUID del registro', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalle del registro.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  detalle(@Param('id') id: string) {
    return this.registrosService.buscarPorId(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar registro completo (PUT)',
    description: 'Reemplaza todos los campos modificables del registro.',
  })
  @ApiParam({ name: 'id', description: 'UUID del registro', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Registro actualizado.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  actualizarCompleto(
    @Param('id') id: string,
    @Body() dto: ActualizarRegistroDto,
  ) {
    return this.registrosService.actualizarCompleto(id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualización parcial del registro (PATCH)',
    description: 'Actualiza únicamente duración y/o notas del registro.',
  })
  @ApiParam({ name: 'id', description: 'UUID del registro', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Registro parcialmente actualizado.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  actualizarParcial(
    @Param('id') id: string,
    @Body() dto: ActualizarParcialRegistroDto,
  ) {
    return this.registrosService.actualizarParcial(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar registro de entrenamiento' })
  @ApiParam({ name: 'id', description: 'UUID del registro', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Registro eliminado.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  eliminar(@Param('id') id: string) {
    return this.registrosService.eliminar(id);
  }
}
