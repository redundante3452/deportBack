import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { logEstructurado } from '../logging/log-estructurado';
import { obtenerTraceId } from '../trace-id/trace-id.util';
import {
  obtenerCaller,
  obtenerClientIp,
  type RequestLlamador,
} from './contexto-llamador';

const VENTANA_MS = 60_000;

/**
 * Límite de borrados por llamador en ventana deslizante de 60 s (contención E4).
 * Se activa con SECURITY_DELETE_LIMIT_ENABLED=true; el tope sale de
 * SECURITY_DELETE_LIMIT_PER_MINUTE (default 10). Se lee el entorno en cada
 * petición. Contadores EN MEMORIA POR POD: con N réplicas el límite efectivo
 * es N x límite. Solo cuentan los intentos de borrado (antes de borrar).
 * Debe ir en @UseGuards del handler DELETE; el TeamApiKeyGuard (global)
 * corre antes.
 */
@Injectable()
export class LimiteBorradoGuard implements CanActivate {
  private readonly intentos = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    if (process.env.SECURITY_DELETE_LIMIT_ENABLED !== 'true') {
      return true;
    }

    const parsed = parseInt(
      process.env.SECURITY_DELETE_LIMIT_PER_MINUTE ?? '',
      10,
    );
    const limite = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;

    const request = context
      .switchToHttp()
      .getRequest<RequestLlamador & { params?: Record<string, string> }>();
    const caller = obtenerCaller(request);
    const clientIp = obtenerClientIp(request);
    const clave = caller !== 'anonimo' ? caller : clientIp;

    const ahora = Date.now();
    const vigentes = (this.intentos.get(clave) ?? []).filter(
      (t) => ahora - t < VENTANA_MS,
    );

    if (vigentes.length >= limite) {
      this.intentos.set(clave, vigentes);
      logEstructurado('WARNING', 'security_mass_delete_blocked', {
        trace_id: obtenerTraceId(request),
        client_ip: clientIp,
        caller,
        borrados_en_ventana: vigentes.length,
        limite,
        deportista_id: request.params?.id,
      });
      throw new HttpException(
        'Demasiados borrados en la última ventana',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    vigentes.push(ahora);
    this.intentos.set(clave, vigentes);
    return true;
  }
}
