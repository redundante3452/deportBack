import { Module } from '@nestjs/common';
import { DeportistasService } from './services/deportistas.service';
import { DeportistasController } from './controllers/deportistas.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Deportista } from './entities/deportista.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deportista])],
  controllers: [DeportistasController],
  providers: [DeportistasService],
})
export class DeportistasModule {}
