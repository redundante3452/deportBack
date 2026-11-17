import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { logEstructurado } from '../logging/log-estructurado';
import { obtenerTraceId } from '../trace-id/trace-id.util';
import { obtenerCaller, type RequestLlamador } from './contexto-llamador';

type RequestHoneytoken = RequestLlamador & {
  params?: Record<string, string>;
  method?: string;
  originalUrl?: string;
  url?: string;
};

function idsHoneytoken(): Set<string> {
  return new Set(
    (process.env.SECURITY_HONEYTOKEN_IDS ?? '')
      .split(',')
      .map((id) => id.trim().toLowerCase())
      .filter((id) => id.length > 0),
  );
}

function versionApi(path: string): 'v1' | 'v2' | 'v3' {
  if (path.startsWith('/api/v2/')) return 'v2';
  if (path.startsWith('/api/v3/')) return 'v3';
  return 'v1';
}

/**
 * Honeytoken: registro señuelo (SECURITY_HONEYTOKEN_IDS, UUIDs separados por
 * coma; vacío = desactivado). Cualquier petición :id sobre un id señuelo emite
 * `security_honeytoken_triggered` y sigue su curso normal (la respuesta no
 * cambia, para no alertar al atacante). Los listados no traen :id: no disparan.
 * Se lee el entorno en cada petición.
 */
@Injectable()
export class HoneytokenInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestHoneytoken>();
    const id = request.params?.id;

    if (id && idsHoneytoken().has(id.toLowerCase())) {
      const path = (request.originalUrl ?? request.url ?? '').split('?')[0];
      logEstructurado('WARNING', 'security_honeytoken_triggered', {
        deportista_id: id,
        method: request.method,
        path,
        caller: obtenerCaller(request),
        trace_id: obtenerTraceId(request),
        api_version: versionApi(path),
      });
    }

    return next.handle();
  }
}
