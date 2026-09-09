import { Module } from '@nestjs/common';
import { HttpExternoService } from './http-externo.service';

@Module({
  providers: [HttpExternoService],
  exports: [HttpExternoService],
})
export class HttpExternoModule {}
