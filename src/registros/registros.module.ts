import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrosController } from './controllers/registros.controller';
import { RegistrosService } from './services/registros.service';
import { Registro } from './entities/registro.entity';
import { Habito } from '../habitos/entities/habito.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Registro, Habito])],
  controllers: [RegistrosController],
  providers: [RegistrosService],
})
export class RegistrosModule {}
