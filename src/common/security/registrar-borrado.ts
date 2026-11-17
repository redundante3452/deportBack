import { logEstructurado } from '../logging/log-estructurado';
import { obtenerTraceId } from '../trace-id/trace-id.util';
import {
  obtenerCaller,
  obtenerClientIp,
  type RequestLlamador,
} from './contexto-llamador';

export function registrarBorrado(
  request: RequestLlamador,
  deportistaId: string,
  apiVersion: 'v1' | 'v2' | 'v3',
): void {
  logEstructurado('INFO', 'deportista_deleted', {
    deportista_id: deportistaId,
    trace_id: obtenerTraceId(request),
    api_version: apiVersion,
    client_ip: obtenerClientIp(request),
    caller: obtenerCaller(request),
  });
}
