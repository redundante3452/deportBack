export type ErrorTypeHttpExterno =
  | 'circuit_open'
  | 'timeout'
  | 'http_error'
  | 'connection_error'
  | 'insecure_url'
  | 'no_url';

export interface ResultadoHttpExterno {
  ok: boolean;
  data?: unknown;
  error?: string;
  errorType?: ErrorTypeHttpExterno;
}
