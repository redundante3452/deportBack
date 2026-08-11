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

@Injectable()
export class RegistrosService {
  constructor(
    @InjectRepository(Registro)
    private readonly registroRepository: Repository<Registro>,
    @InjectRepository(Habito)
    private readonly habitoRepository: Repository<Habito>,
  ) {}

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
      throw new ConflictException('Ya existe un registro para ese hábito en esa fecha');
    }

    const registro = this.registroRepository.create({
      ...dto,
      habito,
    });

    return this.registroRepository.save(registro);
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

    return query.getMany();
  }
}
