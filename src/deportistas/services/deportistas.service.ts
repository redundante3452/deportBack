import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Deportista } from '../entities/deportista.entity';
import { ILike, Repository } from 'typeorm';
import { CreateDeportistaDto } from '../dto/create-deportista.dto';
import { BuscarDeportistasDto } from '../dto/buscar-deportistas.dto';
import { ReemplazarDeportistaDto } from '../dto/reemplazar-deportista.dto';
import { ActualizarParcialDeportistaDto } from '../dto/actualizar-parcial-deportista.dto';
import { ConfigService } from '@nestjs/config';
import { HttpExternoService } from '../../common/http-externo/http-externo.service';
import { ResultadoHttpExterno } from '../../common/http-externo/http-externo.types';
import { CacheDistribuidaService } from '../../common/cache-distribuida/cache-distribuida.service';

function datoOError(resultado: ResultadoHttpExterno): unknown {
  return resultado.ok ? resultado.data : { error: resultado.error };
}

const CLAVE_CACHE_APIS_EXTERNAS = 'apis-externas:articulos-skus';
const TTL_CACHE_APIS_EXTERNAS_SEGUNDOS = 30;

@Injectable()
export class DeportistasService {
  private readonly logger = new Logger(DeportistasService.name);

  constructor(
    @InjectRepository(Deportista)
    private readonly deportistaRepository: Repository<Deportista>,
    private readonly httpExternoService: HttpExternoService,
    private readonly configService: ConfigService,
    private readonly cacheDistribuidaService: CacheDistribuidaService,
  ) {}

  async cheqUser(email: string): Promise<void> {
    const deportista = await this.deportistaRepository.findOne({
      where: { email },
    });
    if (deportista) {
      throw new ConflictException('El deportista ya existe');
    }
  }

  async create(deportistadto: CreateDeportistaDto): Promise<Deportista> {
    await this.cheqUser(String(deportistadto.email));
    const deportista = this.deportistaRepository.create(deportistadto);
    return this.deportistaRepository.save(deportista);
  }

  async listar(nombre: string, email: string): Promise<Deportista[]> {
    return this.deportistaRepository.find({
      where: {
        ...(nombre ? { nombre: ILike(`%${nombre}%`) } : {}),
        ...(email ? { email: ILike(`%${email}%`) } : {}),
      },
    });
  }

  async buscarAvanzado(
    buscarDeportistasDto: BuscarDeportistasDto,
  ): Promise<Deportista[]> {
    return this.listar(buscarDeportistasDto.nombre, buscarDeportistasDto.email);
  }

  async buscarPorId(id: string): Promise<Deportista> {
    const deportista = await this.deportistaRepository.findOne({
      where: { id },
    });
    if (!deportista) {
      throw new NotFoundException(`Deportista ${id} no encontrado`);
    }
    return deportista;
  }

  async reemplazar(
    id: string,
    dto: ReemplazarDeportistaDto,
  ): Promise<Deportista> {
    const deportista = await this.buscarPorId(id);
    if (dto.email !== deportista.email) {
      await this.cheqUser(dto.email);
    }
    deportista.nombre = dto.nombre;
    deportista.email = dto.email;
    return this.deportistaRepository.save(deportista);
  }

  async actualizarParcial(
    id: string,
    dto: ActualizarParcialDeportistaDto,
  ): Promise<Deportista> {
    const deportista = await this.buscarPorId(id);
    if (dto.email && dto.email !== deportista.email) {
      await this.cheqUser(String(dto.email));
    }
    Object.assign(deportista, dto);
    return this.deportistaRepository.save(deportista);
  }

  async eliminar(id: string): Promise<void> {
    const deportista = await this.buscarPorId(id);
    await this.deportistaRepository.remove(deportista);
  }

  async obtenerApisExternas(traceId?: string): Promise<{
    api_fastify: unknown;
    inventario_u: unknown;
  }> {
    const enCache = await this.cacheDistribuidaService.obtener<{
      api_fastify: unknown;
      inventario_u: unknown;
    }>(CLAVE_CACHE_APIS_EXTERNAS);

    if (enCache) {
      this.logger.log(`[trace:${traceId}] apis_externas servido desde cache`);
      return enCache;
    }

    const apiFastifyUrl = this.configService.get<string>('API_FASTIFY_URL');
    const inventarioUUrl = this.configService.get<string>('INVENTARIO_U_URL');

    const [articulos, skus] = await Promise.all([
      this.consultarSiHayUrl(apiFastifyUrl, '/articulos', traceId),
      this.consultarSiHayUrl(inventarioUUrl, '/skus', traceId),
    ]);

    if (!articulos.ok) {
      this.logger.warn(
        `[trace:${traceId}] api-fastify no respondió: ${articulos.error}`,
      );
    }
    if (!skus.ok) {
      this.logger.warn(
        `[trace:${traceId}] Inventario-U no respondió: ${skus.error}`,
      );
    }

    const resultado = {
      api_fastify: datoOError(articulos),
      inventario_u: datoOError(skus),
    };

    // solo cacheamos si ambas respondieron bien: un error transitorio no debe
    // quedar "congelado" 30 segundos para todos los que llamen al v2 mientras tanto
    if (articulos.ok && skus.ok) {
      await this.cacheDistribuidaService.guardar(
        CLAVE_CACHE_APIS_EXTERNAS,
        resultado,
        TTL_CACHE_APIS_EXTERNAS_SEGUNDOS,
      );
    }

    return resultado;
  }

  private consultarSiHayUrl(
    baseUrl: string | undefined,
    ruta: string,
    traceId?: string,
  ): Promise<ResultadoHttpExterno> {
    if (!baseUrl) {
      return Promise.resolve({
        ok: false,
        error: `no hay URL configurada para ${ruta}`,
      });
    }
    const teamApiKey = this.configService.get<string>('TEAM_API_KEY');
    const headers: Record<string, string> = {};
    if (teamApiKey) {
      headers['X-Api-Key'] = teamApiKey;
    }
    if (traceId) {
      // propaga el mismo identificador de correlación hacia la otra nube,
      // para poder seguir un mismo mensaje extremo a extremo
      headers['X-Trace-Id'] = traceId;
    }
    return this.httpExternoService.obtenerJson(
      `${baseUrl}${ruta}`,
      undefined,
      Object.keys(headers).length > 0 ? headers : undefined,
    );
  }
}
