import { Injectable, Logger } from '@nestjs/common';
import { ResultadoHttpExterno } from './http-externo.types';

const TIMEOUT_MS_DEFAULT = 5000;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 30_000;

interface EstadoCircuito {
  fallos: number;
  abiertoDesde?: number;
}

@Injectable()
export class HttpExternoService {
  private readonly logger = new Logger(HttpExternoService.name);
  private readonly circuitos = new Map<string, EstadoCircuito>();

  async obtenerJson(
    url: string,
    timeoutMs = TIMEOUT_MS_DEFAULT,
    headers?: Record<string, string>,
  ): Promise<ResultadoHttpExterno> {
    if (this.urlNoSeguraEnProduccion(url)) {
      this.logger.warn(
        JSON.stringify({
          event: 'security_insecure_dependency_url_blocked',
          url,
        }),
      );
      return {
        ok: false,
        error: `URL no segura bloqueada en producción: ${url}`,
      };
    }

    const circuitoHabilitado =
      process.env.RESILIENCE_CIRCUIT_BREAKER_ENABLED !== 'false';
    const circuito = this.circuitos.get(url);
    if (circuitoHabilitado && circuito?.abiertoDesde) {
      if (Date.now() - circuito.abiertoDesde < CIRCUIT_COOLDOWN_MS) {
        return {
          ok: false,
          error: `circuito abierto para ${url}`,
        };
      }
      this.circuitos.delete(url);
    }

    if (this.dependenciaNoDisponible(url)) {
      return this.registrarFallo(
        url,
        'dependencia no disponible (caos)',
        circuitoHabilitado,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const respuesta = await fetch(url, {
        signal: controller.signal,
        headers,
      });

      if (!respuesta.ok) {
        return this.registrarFallo(
          url,
          `respuesta ${respuesta.status} de ${url}`,
          circuitoHabilitado,
        );
      }

      const data = (await respuesta.json()) as unknown;
      this.circuitos.delete(url);
      return { ok: true, data };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return this.registrarFallo(
          url,
          `tiempo de espera agotado llamando a ${url}`,
          circuitoHabilitado,
        );
      }

      const mensaje = error instanceof Error ? error.message : String(error);
      return this.registrarFallo(
        url,
        `no se pudo conectar a ${url}: ${mensaje}`,
        circuitoHabilitado,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private dependenciaNoDisponible(url: string): boolean {
    if (process.env.CHAOS_DEPENDENCY_FAILURE !== 'true') {
      return false;
    }

    const objetivo = process.env.CHAOS_DEPENDENCY_TARGET;
    return !objetivo || url.includes(objetivo);
  }

  private urlNoSeguraEnProduccion(url: string): boolean {
    if (process.env.NODE_ENV !== 'production') {
      return false;
    }

    try {
      return new URL(url).protocol !== 'https:';
    } catch {
      return true;
    }
  }

  private registrarFallo(
    url: string,
    error: string,
    circuitoHabilitado: boolean,
  ): ResultadoHttpExterno {
    if (!circuitoHabilitado) {
      return { ok: false, error };
    }

    const estado = this.circuitos.get(url) ?? { fallos: 0 };
    estado.fallos += 1;
    if (estado.fallos >= CIRCUIT_FAILURE_THRESHOLD) {
      estado.abiertoDesde = Date.now();
    }
    this.circuitos.set(url, estado);
    return { ok: false, error };
  }
}
