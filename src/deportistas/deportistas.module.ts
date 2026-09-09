import { Module } from '@nestjs/common';
import { DeportistasService } from './services/deportistas.service';
import { DeportistasController } from './controllers/deportistas.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Deportista } from './entities/deportista.entity';
import { HttpExternoModule } from '../common/http-externo/http-externo.module';

@Module({
  imports: [TypeOrmModule.forFeature([Deportista]), HttpExternoModule],
  controllers: [DeportistasController],
  providers: [DeportistasService],
})
export class DeportistasModule {}
