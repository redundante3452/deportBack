import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RequestConHeaders {
  headers: Record<string, string | string[] | undefined>;
  url?: string;
  method?: string;
  traceId?: string;
}

@Injectable()
export class TeamApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(TeamApiKeyGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const teamApiKey = this.configService.get<string>('TEAM_API_KEY');

    if (!teamApiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestConHeaders>();

    // la raíz "/" es el healthcheck de Kubernetes (readiness/liveness),
    // no manda X-Api-Key: si la bloqueamos, k8s reinicia el pod en loop
    if (request.url === '/') {
      return true;
    }

    const header = request.headers['x-api-key'];

    if (header !== teamApiKey) {
      this.logger.warn(
        JSON.stringify({
          event: 'security_authentication_denied',
          mechanism: 'team_api_key',
          method: request.method,
          path: request.url,
          trace_id: request.traceId ?? 'sin-trace-id',
          reason: Array.isArray(header)
            ? 'multiple_headers'
            : 'invalid_or_missing',
        }),
      );
      throw new UnauthorizedException('X-Api-Key inválida o ausente');
    }

    return true;
  }
}
