import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registro } from '../entities/registro.entity';
import { CrearRegistroDto } from '../dto/crear-registro.dto';
import { BuscarRegistrosDto } from '../dto/buscar-registros.dto';
import { Habito } from '../../habitos/entities/habito.entity';
import { ActualizarRegistroDto } from '../dto/actualizar-registro.dto';
import { ActualizarParcialRegistroDto } from '../dto/actualizar-parcial-registro.dto';

@Injectable()
export class RegistrosService {
  constructor(
    @InjectRepository(Registro)
    private readonly registroRepository: Repository<Registro>,
    @InjectRepository(Habito)
    private readonly habitoRepository: Repository<Habito>,
  ) {}

  private toDayIndex(fecha: string): number {
    const parsed = new Date(`${fecha}T00:00:00Z`);
    return Math.floor(parsed.getTime() / 86400000);
  }

  private async recalcularRachas(habitoId: string): Promise<void> {
    const habito = await this.habitoRepository.findOne({
      where: { id: habitoId },
    });
    if (!habito) {
      throw new NotFoundException(`Hábito ${habitoId} no encontrado`);
    }

    const registros = await this.registroRepository.find({
      where: { habitoId },
      order: { fecha: 'ASC' },
    });

    let rachaActual = 0;
    let rachaMaxima = 0;
    let ultimaFechaCumplida: number | null = null;

    for (const registro of registros) {
      if (!registro.completado) {
        rachaActual = 0;
        ultimaFechaCumplida = null;
        continue;
      }

      const fechaRegistro = this.toDayIndex(registro.fecha);
      if (
        ultimaFechaCumplida !== null &&
        fechaRegistro === ultimaFechaCumplida + 1
      ) {
        rachaActual += 1;
      } else {
        rachaActual = 1;
      }

      ultimaFechaCumplida = fechaRegistro;
      if (rachaActual > rachaMaxima) {
        rachaMaxima = rachaActual;
      }
    }

    habito.rachaActual = rachaActual;
    habito.rachaMaxima = rachaMaxima;
    await this.habitoRepository.save(habito);
  }

  async create(dto: CrearRegistroDto): Promise<Registro> {
    const habito = await this.habitoRepository.findOne({
      where: { id: dto.habitoId },
    });
    if (!habito) {
      throw new NotFoundException(`Hábito ${dto.habitoId} no encontrado`);
    }

    const duplicado = await this.registroRepository.findOne({
      where: { habitoId: dto.habitoId, fecha: dto.fecha },
    });
    if (duplicado) {
      throw new ConflictException(
        'Ya existe un registro para ese hábito en esa fecha',
      );
    }

    const registro = this.registroRepository.create({
      ...dto,
      habito,
    });

    const guardado = await this.registroRepository.save(registro);
    await this.recalcularRachas(dto.habitoId);
    return guardado;
  }

  async historial(dto: BuscarRegistrosDto): Promise<Registro[]> {
    const query = this.registroRepository
      .createQueryBuilder('registro')
      .orderBy('registro.fecha', 'DESC');

    if (dto.habitoId) {
      query.andWhere('registro.habitoId = :habitoId', {
        habitoId: dto.habitoId,
      });
    }

    if (dto.desde) {
      query.andWhere('registro.fecha >= :desde', { desde: dto.desde });
    }

    if (dto.hasta) {
      query.andWhere('registro.fecha <= :hasta', { hasta: dto.hasta });
    }

    if (dto.completado !== undefined && dto.completado !== null) {
      const completadoBool =
        typeof dto.completado === 'string'
          ? dto.completado === 'true'
          : !!dto.completado;
      query.andWhere('registro.completado = :completado', {
        completado: completadoBool,
      });
    }

    if (dto.rpeMin !== undefined && dto.rpeMin !== null) {
      const rpeMinVal =
        typeof dto.rpeMin === 'number'
          ? dto.rpeMin
          : parseInt(dto.rpeMin as string, 10);
      query.andWhere('registro.rpe >= :rpeMin', { rpeMin: rpeMinVal });
    }

    if (dto.duracionMinima !== undefined && dto.duracionMinima !== null) {
      const durMinVal =
        typeof dto.duracionMinima === 'number'
          ? dto.duracionMinima
          : parseInt(dto.duracionMinima as string, 10);
      query.andWhere('registro.duracionMinutos >= :duracionMinima', {
        duracionMinima: durMinVal,
      });
    }

    return query.getMany();
  }

  async buscarPorId(id: string): Promise<Registro> {
    const registro = await this.registroRepository.findOne({ where: { id } });
    if (!registro) {
      throw new NotFoundException(`Registro ${id} no encontrado`);
    }
    return registro;
  }

  async actualizarCompleto(
    id: string,
    dto: ActualizarRegistroDto,
  ): Promise<Registro> {
    const registro = await this.buscarPorId(id);
    registro.fecha = dto.fecha ?? registro.fecha;
    registro.completado = dto.completado ?? registro.completado;
    registro.duracionMinutos = dto.duracionMinutos ?? registro.duracionMinutos;
    registro.rpe = dto.rpe ?? registro.rpe;
    registro.notas = dto.notas ?? registro.notas;

    const guardado = await this.registroRepository.save(registro);
    await this.recalcularRachas(registro.habitoId);
    return guardado;
  }

  async actualizarParcial(
    id: string,
    dto: ActualizarParcialRegistroDto,
  ): Promise<Registro> {
    const registro = await this.buscarPorId(id);
    registro.duracionMinutos = dto.duracionMinutos ?? registro.duracionMinutos;
    registro.notas = dto.notas ?? registro.notas;
    return this.registroRepository.save(registro);
  }

  async eliminar(id: string): Promise<void> {
    const registro = await this.buscarPorId(id);
    await this.registroRepository.remove(registro);
    await this.recalcularRachas(registro.habitoId);
  }
}
