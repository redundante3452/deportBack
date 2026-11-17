import { HttpException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { LimiteBorradoGuard } from './limite-borrado.guard';
import { registrarBorrado } from './registrar-borrado';

function ctx(headers: Record<string, string> = {}, ip = '9.9.9.9') {
  const request = { headers, ip, traceId: 't-1', params: { id: 'dep-1' } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('LimiteBorradoGuard', () => {
  let guard: LimiteBorradoGuard;
  let escribir: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    guard = new LimiteBorradoGuard();
    escribir = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    delete process.env.SECURITY_DELETE_LIMIT_ENABLED;
    delete process.env.SECURITY_DELETE_LIMIT_PER_MINUTE;
  });

  afterEach(() => {
    jest.useRealTimers();
    escribir.mockRestore();
    delete process.env.SECURITY_DELETE_LIMIT_ENABLED;
    delete process.env.SECURITY_DELETE_LIMIT_PER_MINUTE;
  });

  it('desactivado no limita', () => {
    for (let i = 0; i < 50; i++) {
      expect(guard.canActivate(ctx({ 'x-api-key': 'a' }))).toBe(true);
    }
  });

  it('activado permite N y bloquea N+1 con 429 y evento', () => {
    process.env.SECURITY_DELETE_LIMIT_ENABLED = 'true';
    process.env.SECURITY_DELETE_LIMIT_PER_MINUTE = '3';
    for (let i = 0; i < 3; i++) {
      expect(guard.canActivate(ctx({ 'x-api-key': 'a' }))).toBe(true);
    }
    let error: HttpException | undefined;
    try {
      guard.canActivate(ctx({ 'x-api-key': 'a' }));
    } catch (e) {
      error = e as HttpException;
    }
    expect(error?.getStatus()).toBe(429);
    const evento = JSON.parse(String(escribir.mock.calls[0][0]));
    expect(evento).toMatchObject({
      severity: 'WARNING',
      event: 'security_mass_delete_blocked',
      trace_id: 't-1',
      borrados_en_ventana: 3,
      limite: 3,
      deportista_id: 'dep-1',
    });
  });

  it('default 10 por minuto', () => {
    process.env.SECURITY_DELETE_LIMIT_ENABLED = 'true';
    for (let i = 0; i < 10; i++) guard.canActivate(ctx({ 'x-api-key': 'a' }));
    expect(() => guard.canActivate(ctx({ 'x-api-key': 'a' }))).toThrow(
      HttpException,
    );
  });

  it('claves distintas no se mezclan; sin key usa la IP', () => {
    process.env.SECURITY_DELETE_LIMIT_ENABLED = 'true';
    process.env.SECURITY_DELETE_LIMIT_PER_MINUTE = '1';
    expect(guard.canActivate(ctx({ 'x-api-key': 'a' }))).toBe(true);
    expect(guard.canActivate(ctx({ 'x-api-key': 'b' }))).toBe(true);
    expect(guard.canActivate(ctx({}, '1.1.1.1'))).toBe(true);
    expect(guard.canActivate(ctx({}, '2.2.2.2'))).toBe(true);
    expect(() => guard.canActivate(ctx({}, '1.1.1.1'))).toThrow(HttpException);
  });

  it('la ventana expira', () => {
    process.env.SECURITY_DELETE_LIMIT_ENABLED = 'true';
    process.env.SECURITY_DELETE_LIMIT_PER_MINUTE = '1';
    guard.canActivate(ctx({ 'x-api-key': 'a' }));
    expect(() => guard.canActivate(ctx({ 'x-api-key': 'a' }))).toThrow(
      HttpException,
    );
    jest.advanceTimersByTime(60_001);
    expect(guard.canActivate(ctx({ 'x-api-key': 'a' }))).toBe(true);
  });
});

describe('registrarBorrado', () => {
  it('anonimo sin key y usa request.ip', () => {
    const escribir = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    registrarBorrado({ headers: {}, ip: '7.7.7.7' }, 'x', 'v3');
    const l = JSON.parse(String(escribir.mock.calls[0][0]));
    escribir.mockRestore();
    expect(l).toMatchObject({
      event: 'deportista_deleted',
      api_version: 'v3',
      caller: 'anonimo',
      client_ip: '7.7.7.7',
      trace_id: 'sin-trace-id',
    });
  });
});
