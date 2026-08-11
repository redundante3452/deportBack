import { Module } from '@nestjs/common';
import { DeportistasService } from './services/deportistas.service';
import { DeportistasController } from './controllers/deportistas.controller';

@Module({
  controllers: [DeportistasController],
  providers: [DeportistasService],
})
export class DeportistasModule {}
