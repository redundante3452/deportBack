import { Module } from '@nestjs/common';
import { CacheController } from './cache.controller';
import { CacheDistribuidaModule } from '../common/cache-distribuida/cache-distribuida.module';

@Module({
  imports: [CacheDistribuidaModule],
  controllers: [CacheController],
})
export class CacheModule {}
