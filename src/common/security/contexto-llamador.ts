import { createHash } from 'crypto';
import type { RequestConTraceId } from '../trace-id/trace-id.util';

export interface RequestLlamador extends RequestConTraceId {
  ip?: string;
}

function primerValor(v: string | string[] | undefined): string | undefined {
  const crudo = Array.isArray(v) ? v[0] : v;
  const primero = crudo?.split(',')[0]?.trim();
  return primero ? primero : undefined;
}

/** Primeros 12 hex del sha256 de x-api-key, o 'anonimo'. Nunca la key en claro. */
export function obtenerCaller(request: RequestLlamador): string {
  const key = request.headers['x-api-key'];
  const valor = Array.isArray(key) ? key[0] : key;
  if (!valor) return 'anonimo';
  return createHash('sha256').update(valor).digest('hex').slice(0, 12);
}

export function obtenerClientIp(request: RequestLlamador): string {
  return (
    primerValor(request.headers['x-forwarded-for']) ??
    request.ip ??
    'desconocida'
  );
}
