import {
  ConflictException,
  Injectable,
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

function datoOError(resultado: ResultadoHttpExterno): unknown {
  return resultado.ok ? resultado.data : { error: resultado.error };
}

@Injectable()
export class DeportistasService {
  constructor(
    @InjectRepository(Deportista)
    private readonly deportistaRepository: Repository<Deportista>,
    private readonly httpExternoService: HttpExternoService,
    private readonly configService: ConfigService,
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

  async obtenerApisExternas(): Promise<{
    api_fastify: unknown;
    inventario_u: unknown;
  }> {
    const apiFastifyUrl = this.configService.get<string>('API_FASTIFY_URL');
    const inventarioUUrl = this.configService.get<string>('INVENTARIO_U_URL');

    const [articulos, skus] = await Promise.all([
      this.httpExternoService.obtenerJson(`${apiFastifyUrl}/articulos`),
      this.httpExternoService.obtenerJson(`${inventarioUUrl}/skus`),
    ]);

    return {
      api_fastify: datoOError(articulos),
      inventario_u: datoOError(skus),
    };
  }
}
