import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitosController } from './controllers/habitos.controller';
import { HabitosService } from './services/habitos.service';
import { Habito } from './entities/habito.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Habito])],
  controllers: [HabitosController],
  providers: [HabitosService],
})
export class HabitosModule {}
