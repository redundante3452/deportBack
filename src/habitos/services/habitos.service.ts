import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Habito } from '../entities/habito.entity';
import { CrearHabitoDto } from '../dto/crear-habito.dto';
import { BuscarHabitosDto } from '../dto/buscar-habitos.dto';
import { ReemplazarHabitoDto } from '../dto/reemplazar-habito.dto';
import { ActualizarFrecuenciaHabitoDto } from '../dto/actualizar-frecuencia-habito.dto';

@Injectable()
export class HabitosService {
  constructor(
    @InjectRepository(Habito)
    private readonly habitoRepository: Repository<Habito>,
  ) {}

  async cheqHabito(
    nombre: string,
    deportistaId: string,
    excludeId?: string,
  ): Promise<void> {
    const habito = await this.habitoRepository.findOne({
      where: { nombre, deportistaId },
    });
    if (habito && habito.id !== excludeId) {
      throw new ConflictException('El hábito ya existe para este deportista');
    }
  }

  async create(dto: CrearHabitoDto): Promise<Habito> {
    await this.cheqHabito(dto.nombre, dto.deportistaId);
    const habito = this.habitoRepository.create({
      ...dto,
      rachaActual: 0,
      rachaMaxima: 0,
    });
    return this.habitoRepository.save(habito);
  }

  async listar(frecuencia?: string, deportistaId?: string): Promise<Habito[]> {
    return this.habitoRepository.find({
      where: {
        ...(frecuencia ? { frecuencia: ILike(`%${frecuencia}%`) } : {}),
        ...(deportistaId ? { deportistaId } : {}),
      },
    });
  }

  async buscarAvanzado(dto: BuscarHabitosDto): Promise<Habito[]> {
    return this.habitoRepository.find({
      where: {
        ...(dto.nombre ? { nombre: ILike(`%${dto.nombre}%`) } : {}),
        ...(dto.frecuencia ? { frecuencia: ILike(`%${dto.frecuencia}%`) } : {}),
        ...(dto.deportistaId ? { deportistaId: dto.deportistaId } : {}),
        ...(dto.rachaActual !== undefined
          ? { rachaActual: dto.rachaActual }
          : {}),
      },
    });
  }

  async buscarPorId(id: string): Promise<Habito> {
    const habito = await this.habitoRepository.findOne({ where: { id } });
    if (!habito) {
      throw new NotFoundException(`Hábito ${id} no encontrado`);
    }
    return habito;
  }

  async reemplazar(id: string, dto: ReemplazarHabitoDto): Promise<Habito> {
    const habito = await this.buscarPorId(id);
    if (
      dto.nombre !== habito.nombre ||
      dto.deportistaId !== habito.deportistaId
    ) {
      await this.cheqHabito(dto.nombre, dto.deportistaId, id);
    }
    habito.nombre = dto.nombre;
    habito.descripcion = dto.descripcion;
    habito.frecuencia = dto.frecuencia;
    habito.deportistaId = dto.deportistaId;
    habito.rachaActual = dto.rachaActual;
    habito.rachaMaxima = dto.rachaMaxima;
    return this.habitoRepository.save(habito);
  }

  async actualizarFrecuencia(
    id: string,
    dto: ActualizarFrecuenciaHabitoDto,
  ): Promise<Habito> {
    const habito = await this.buscarPorId(id);
    habito.frecuencia = dto.frecuencia;
    return this.habitoRepository.save(habito);
  }

  async eliminar(id: string): Promise<void> {
    const habito = await this.buscarPorId(id);
    await this.habitoRepository.remove(habito);
  }
}
