import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habito } from '../habitos/entities/habito.entity';
import { Registro } from '../registros/entities/registro.entity';
import { LogrosController } from './controllers/logros.controller';
import { LogrosService } from './services/logros.service';

@Module({
  imports: [TypeOrmModule.forFeature([Habito, Registro])],
  controllers: [LogrosController],
  providers: [LogrosService],
})
export class LogrosModule {}
