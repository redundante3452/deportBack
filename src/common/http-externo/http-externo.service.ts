import { Injectable } from '@nestjs/common';
import { ResultadoHttpExterno } from './http-externo.types';

const TIMEOUT_MS_DEFAULT = 5000;

@Injectable()
export class HttpExternoService {
  async obtenerJson(
    url: string,
    timeoutMs = TIMEOUT_MS_DEFAULT,
  ): Promise<ResultadoHttpExterno> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const respuesta = await fetch(url, { signal: controller.signal });

      if (!respuesta.ok) {
        return { ok: false, error: `respuesta ${respuesta.status} de ${url}` };
      }

      const data = (await respuesta.json()) as unknown;
      return { ok: true, data };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          ok: false,
          error: `tiempo de espera agotado llamando a ${url}`,
        };
      }

      const mensaje = error instanceof Error ? error.message : String(error);
      return { ok: false, error: `no se pudo conectar a ${url}: ${mensaje}` };
    } finally {
      clearTimeout(timeout);
    }
  }
}
