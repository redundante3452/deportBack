import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RequestConHeaders {
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class TeamApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const teamApiKey = this.configService.get<string>('TEAM_API_KEY');

    if (!teamApiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestConHeaders>();
    const header = request.headers['x-api-key'];

    if (header !== teamApiKey) {
      throw new UnauthorizedException('X-Api-Key inválida o ausente');
    }

    return true;
  }
}
