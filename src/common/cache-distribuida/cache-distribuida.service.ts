import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const PUERTO_REDIS_DEFAULT = 6379;

@Injectable()
export class CacheDistribuidaService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheDistribuidaService.name);
  private readonly cliente: Redis | null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST');

    if (!host) {
      this.logger.warn(
        'REDIS_HOST no está configurado, la caché distribuida queda desactivada',
      );
      this.cliente = null;
      return;
    }

    const port =
      this.configService.get<number>('REDIS_PORT') ?? PUERTO_REDIS_DEFAULT;

    this.cliente = new Redis({
      host,
      port,
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => 2000,
    });

    this.cliente.on('error', (error) => {
      this.logger.warn(`Redis no responde: ${error.message}`);
    });
  }

  async obtener<T>(clave: string): Promise<T | undefined> {
    if (!this.cliente) {
      return undefined;
    }

    try {
      const valor = await this.cliente.get(clave);
      return valor ? (JSON.parse(valor) as T) : undefined;
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.warn(`no se pudo leer "${clave}" de la caché: ${mensaje}`);
      return undefined;
    }
  }

  async guardar(
    clave: string,
    valor: unknown,
    ttlSegundos: number,
  ): Promise<void> {
    if (!this.cliente) {
      return;
    }

    try {
      await this.cliente.set(clave, JSON.stringify(valor), 'EX', ttlSegundos);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.warn(`no se pudo guardar "${clave}" en la caché: ${mensaje}`);
    }
  }

  onModuleDestroy(): void {
    this.cliente?.disconnect();
  }
}
