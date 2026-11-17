export type SeveridadLog = 'INFO' | 'WARNING' | 'ERROR';

/**
 * Escribe UNA línea JSON a stdout. Cloud Logging la guarda como jsonPayload
 * y reconoce `severity`, de modo que las métricas basadas en logs pueden
 * filtrar por jsonPayload.event (el ConsoleLogger de Nest agrega prefijo y
 * colores ANSI, por eso no sirve para esto).
 */
export function logEstructurado(
  severity: SeveridadLog,
  event: string,
  campos: Record<string, unknown> = {},
): void {
  process.stdout.write(
    JSON.stringify({
      severity,
      event,
      timestamp: new Date().toISOString(),
      ...campos,
    }) + '\n',
  );
}
