import { randomUUID } from 'crypto';

const HEADER_TRACE_ID = 'x-trace-id';

export interface RequestConTraceId {
  headers: Record<string, string | string[] | undefined>;
  traceId?: string;
}

interface ReplyConHeader {
  header(nombre: string, valor: string): unknown;
}

/**
 * Si la petición ya trae X-Trace-Id (porque viene del Gateway o de otra nube
 * que lo propaga), lo respeta. Si no, genera uno nuevo — esto solo pasa
 * cuando alguien llama directo sin pasar por el Gateway (ej. en desarrollo).
 */
export function asignarTraceId(
  request: RequestConTraceId,
  reply: ReplyConHeader,
): string {
  const entrante = request.headers[HEADER_TRACE_ID];
  const traceId =
    typeof entrante === 'string' && entrante.length > 0
      ? entrante
      : randomUUID();

  request.traceId = traceId;
  reply.header('X-Trace-Id', traceId);

  return traceId;
}

export function obtenerTraceId(request: RequestConTraceId): string {
  return request.traceId ?? 'sin-trace-id';
}
