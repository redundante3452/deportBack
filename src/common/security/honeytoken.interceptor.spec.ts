import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { HoneytokenInterceptor } from './honeytoken.interceptor';

const ID_SENUELO = '11111111-2222-4333-8444-555555555555';

function ctx(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function peticion(id?: string, method = 'GET', url = '/api/v2/deportistas') {
  return {
    headers: { 'x-api-key': 'k' },
    traceId: 't-1',
    method,
    originalUrl: id ? `${url}/${id}?x=1` : url,
    params: id ? { id } : {},
  };
}

describe('HoneytokenInterceptor', () => {
  let interceptor: HoneytokenInterceptor;
  let escribir: jest.SpyInstance;
  const handler: CallHandler = { handle: () => of('respuesta') };

  const eventos = () =>
    escribir.mock.calls.map(
      (c) => JSON.parse(String(c[0])) as Record<string, unknown>,
    );

  beforeEach(() => {
    interceptor = new HoneytokenInterceptor();
    escribir = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    process.env.SECURITY_HONEYTOKEN_IDS = `otro-id, ${ID_SENUELO}`;
  });

  afterEach(() => {
    escribir.mockRestore();
    delete process.env.SECURITY_HONEYTOKEN_IDS;
  });

  it('id señuelo: registra el evento y la petición sigue', (done) => {
    interceptor
      .intercept(ctx(peticion(ID_SENUELO, 'DELETE')), handler)
      .subscribe((valor) => {
        expect(valor).toBe('respuesta');
        const [evento] = eventos();
        expect(evento).toMatchObject({
          event: 'security_honeytoken_triggered',
          severity: 'WARNING',
          deportista_id: ID_SENUELO,
          method: 'DELETE',
          path: `/api/v2/deportistas/${ID_SENUELO}`,
          trace_id: 't-1',
          api_version: 'v2',
        });
        expect(evento.caller).not.toBe('anonimo');
        done();
      });
  });

  it('otro id: no registra nada', (done) => {
    interceptor
      .intercept(ctx(peticion('99999999-2222-4333-8444-555555555555')), handler)
      .subscribe(() => {
        expect(escribir).not.toHaveBeenCalled();
        done();
      });
  });

  it('listado (sin :id): no registra nada', (done) => {
    interceptor.intercept(ctx(peticion()), handler).subscribe(() => {
      expect(escribir).not.toHaveBeenCalled();
      done();
    });
  });

  it('entorno vacío: desactivado', (done) => {
    process.env.SECURITY_HONEYTOKEN_IDS = '';
    interceptor
      .intercept(ctx(peticion(ID_SENUELO, 'GET', '/deportistas')), handler)
      .subscribe(() => {
        expect(escribir).not.toHaveBeenCalled();
        done();
      });
  });
});
