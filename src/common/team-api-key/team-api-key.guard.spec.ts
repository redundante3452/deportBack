import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TeamApiKeyGuard } from './team-api-key.guard';

describe('TeamApiKeyGuard', () => {
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function contextFor(request: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('permite el healthcheck aunque exista una clave configurada', () => {
    configService.get = jest.fn().mockReturnValue('secret');
    const guard = new TeamApiKeyGuard(configService);

    expect(
      guard.canActivate(contextFor({ url: '/', headers: {}, method: 'GET' })),
    ).toBe(true);
  });

  it('rechaza una clave ausente sin exponer el valor esperado', () => {
    configService.get = jest.fn().mockReturnValue('secret');
    const guard = new TeamApiKeyGuard(configService);

    expect(() =>
      guard.canActivate(
        contextFor({
          url: '/api/v2/deportistas',
          headers: {},
          method: 'GET',
          traceId: 'trace-synthetic',
        }),
      ),
    ).toThrow('X-Api-Key inválida o ausente');
  });

  it('permite una clave válida', () => {
    configService.get = jest.fn().mockReturnValue('secret');
    const guard = new TeamApiKeyGuard(configService);

    expect(
      guard.canActivate(
        contextFor({
          url: '/api/v2/deportistas',
          headers: { 'x-api-key': 'secret' },
          method: 'GET',
        }),
      ),
    ).toBe(true);
  });
});
