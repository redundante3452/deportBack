import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habito } from '../../habitos/entities/habito.entity';
import { Registro } from '../../registros/entities/registro.entity';
import { BuscarLogrosDto } from '../dto/buscar-logros.dto';

export interface LogroCalculado {
  codigo: string;
  nombre: string;
  descripcion: string;
  habitoId: string;
  habitoNombre: string;
}

const UMBRALES_RACHA = [7, 30, 100];
const MIN_CHECK_INS_COMPLETOS = 10;
const MIN_RPE_ALTO = 5;

@Injectable()
export class LogrosService {
  constructor(
    @InjectRepository(Habito)
    private readonly habitoRepository: Repository<Habito>,
    @InjectRepository(Registro)
    private readonly registroRepository: Repository<Registro>,
  ) {}

  private toDayIndex(fecha: string): number {
    const parsed = new Date(`${fecha}T00:00:00Z`);
    return Math.floor(parsed.getTime() / 86400000);
  }

  private buscarRachaRPEAlto(registros: Registro[]): number {
    let mejor = 0;
    let actual = 0;
    let ultimaFecha: number | null = null;

    for (const registro of registros) {
      if (!registro.completado || registro.rpe < 8) {
        actual = 0;
        ultimaFecha = null;
        continue;
      }

      const fecha = this.toDayIndex(registro.fecha);
      if (ultimaFecha !== null && fecha === ultimaFecha + 1) {
        actual += 1;
      } else {
        actual = 1;
      }

      ultimaFecha = fecha;
      if (actual > mejor) {
        mejor = actual;
      }
    }

    return mejor;
  }

  private construirLogros(
    habito: Habito,
    registros: Registro[],
  ): LogroCalculado[] {
    const logros: LogroCalculado[] = [];

    for (const umbral of UMBRALES_RACHA) {
      if (habito.rachaMaxima >= umbral) {
        logros.push({
          codigo: `racha-${umbral}`,
          nombre: `Racha de ${umbral} días`,
          descripcion: `Alcanzó una racha máxima de al menos ${umbral} días.`,
          habitoId: habito.id,
          habitoNombre: habito.nombre,
        });
      }
    }

    if (
      registros.length >= MIN_CHECK_INS_COMPLETOS &&
      registros.every((registro) => registro.completado)
    ) {
      logros.push({
        codigo: 'cumplimiento-total',
        nombre: 'Cumplimiento total',
        descripcion: `Completó al menos ${MIN_CHECK_INS_COMPLETOS} check-ins sin fallar.`,
        habitoId: habito.id,
        habitoNombre: habito.nombre,
      });
    }

    const rachaRPEAlto = this.buscarRachaRPEAlto(registros);
    if (rachaRPEAlto >= MIN_RPE_ALTO) {
      logros.push({
        codigo: 'rpe-alto',
        nombre: 'Intensidad sostenida',
        descripcion: `Mantuvo RPE >= 8 por al menos ${MIN_RPE_ALTO} días seguidos.`,
        habitoId: habito.id,
        habitoNombre: habito.nombre,
      });
    }

    return logros;
  }

  async buscar(dto: BuscarLogrosDto): Promise<LogroCalculado[]> {
    if (!dto.habitoId && !dto.deportistaId) {
      throw new BadRequestException('Debes enviar habitoId o deportistaId');
    }

    if (dto.habitoId) {
      const habito = await this.habitoRepository.findOne({
        where: { id: dto.habitoId },
      });
      if (!habito) {
        throw new NotFoundException(`Hábito ${dto.habitoId} no encontrado`);
      }

      const registros = await this.registroRepository.find({
        where: { habitoId: dto.habitoId },
        order: { fecha: 'ASC' },
      });

      return this.construirLogros(habito, registros);
    }

    const habitos = await this.habitoRepository.find({
      where: { deportistaId: dto.deportistaId },
      order: { creadoEn: 'DESC' },
    });

    const resultado: LogroCalculado[] = [];
    for (const habito of habitos) {
      const registros = await this.registroRepository.find({
        where: { habitoId: habito.id },
        order: { fecha: 'ASC' },
      });
      resultado.push(...this.construirLogros(habito, registros));
    }

    return resultado;
  }
}
