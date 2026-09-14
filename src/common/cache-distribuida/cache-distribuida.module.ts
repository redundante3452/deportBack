import { Module } from '@nestjs/common';
import { CacheDistribuidaService } from './cache-distribuida.service';

@Module({
  providers: [CacheDistribuidaService],
  exports: [CacheDistribuidaService],
})
export class CacheDistribuidaModule {}
