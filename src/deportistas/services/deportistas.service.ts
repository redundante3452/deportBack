import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Deportista } from '../entities/deportista.entity';
import { ILike, Repository } from 'typeorm';
import { CreateDeportistaDto } from '../dto/create-deportista.dto';

@Injectable()
export class DeportistasService {
  constructor(
    @InjectRepository(Deportista)
    private readonly deportistaRepository: Repository<Deportista>,
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
    await this.cheqUser(deportistadto.email);
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
}
