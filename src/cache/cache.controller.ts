import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CacheDistribuidaService } from '../common/cache-distribuida/cache-distribuida.service';
import { GuardarCacheDto } from './dto/guardar-cache.dto';

const TTL_SEGUNDOS_DEFAULT = 60;

@ApiTags('Cache')
@Controller('cache')
export class CacheController {
  constructor(
    private readonly cacheDistribuidaService: CacheDistribuidaService,
  ) {}

  @Get(':key')
  @ApiOperation({
    summary: 'Consultar una entrada de la caché distribuida',
    description:
      'Componente transversal "Cache": otros servicios (por ejemplo el Orchestrator) consultan aquí antes de llamar a la API real.',
  })
  @ApiParam({ name: 'key', description: 'Clave a buscar' })
  @ApiResponse({ status: 200, description: 'Entrada encontrada.' })
  @ApiResponse({
    status: 404,
    description: 'No existe esa key (nunca se guardó o ya expiró).',
  })
  async obtener(@Param('key') key: string) {
    const value = await this.cacheDistribuidaService.obtener(key);

    if (value === undefined) {
      throw new NotFoundException(
        `no hay ninguna entrada en caché para la key "${key}"`,
      );
    }

    return { key, value };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Guardar una entrada en la caché distribuida',
    description: 'ttl es opcional: si no se manda, queda 60 segundos.',
  })
  @ApiResponse({ status: 201, description: 'Entrada guardada.' })
  async guardar(@Body() dto: GuardarCacheDto) {
    const ttl = dto.ttl ?? TTL_SEGUNDOS_DEFAULT;
    await this.cacheDistribuidaService.guardar(dto.key, dto.value, ttl);
    return { key: dto.key, ttl };
  }
}
