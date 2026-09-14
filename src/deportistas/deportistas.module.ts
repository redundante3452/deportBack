import { Module } from '@nestjs/common';
import { DeportistasService } from './services/deportistas.service';
import { DeportistasController } from './controllers/deportistas.controller';
import { DeportistasV2Controller } from './controllers/deportistas-v2.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Deportista } from './entities/deportista.entity';
import { HttpExternoModule } from '../common/http-externo/http-externo.module';
import { CacheDistribuidaModule } from '../common/cache-distribuida/cache-distribuida.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deportista]),
    HttpExternoModule,
    CacheDistribuidaModule,
  ],
  controllers: [DeportistasController, DeportistasV2Controller],
  providers: [DeportistasService],
})
export class DeportistasModule {}
