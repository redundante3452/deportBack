import { HttpExternoService } from './http-externo.service';

function mockFetchOnce(respuesta: Partial<Response>) {
  (global.fetch as jest.Mock).mockResolvedValueOnce(respuesta);
}

describe('HttpExternoService', () => {
  let service: HttpExternoService;
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    service = new HttpExternoService();
    global.fetch = jest.fn();
    delete process.env.CHAOS_DEPENDENCY_FAILURE;
    delete process.env.CHAOS_DEPENDENCY_TARGET;
    delete process.env.CHAOS_DEPENDENCY_MODE;
    delete process.env.RESILIENCE_CIRCUIT_BREAKER_ENABLED;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    global.fetch = fetchOriginal;
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('bloquea dependencias HTTP en producción', async () => {
    process.env.NODE_ENV = 'production';

    const resultado = await service.obtenerJson('http://api-externa/skus');

    expect(resultado).toEqual({
      ok: false,
      error: 'URL no segura bloqueada en producción: http://api-externa/skus',
      errorType: 'insecure_url',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('devuelve ok:true con el JSON de la respuesta cuando el servicio externo responde bien', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ id: 1, nombre: 'Harina' }]),
    });

    const resultado = await service.obtenerJson('http://api-externa/articulos');

    expect(resultado).toEqual({
      ok: true,
      data: [{ id: 1, nombre: 'Harina' }],
    });
  });

  it('devuelve ok:false cuando el servicio externo responde con un status no exitoso', async () => {
    mockFetchOnce({ ok: false, status: 503 });

    const resultado = await service.obtenerJson('http://api-externa/skus');

    expect(resultado).toEqual({
      ok: false,
      error: 'respuesta 503 de http://api-externa/skus',
      errorType: 'http_error',
    });
  });

  it('devuelve ok:false cuando la conexión falla (host inalcanzable)', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('fetch failed'),
    );

    const resultado = await service.obtenerJson('http://api-externa/skus');

    expect(resultado).toEqual({
      ok: false,
      error: 'no se pudo conectar a http://api-externa/skus: fetch failed',
      errorType: 'connection_error',
    });
  });

  it('devuelve ok:false cuando se agota el tiempo de espera', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    const resultado = await service.obtenerJson('http://api-externa/skus', 10);

    expect(resultado).toEqual({
      ok: false,
      error: 'tiempo de espera agotado llamando a http://api-externa/skus',
      errorType: 'timeout',
    });
  });

  it('devuelve ok:false cuando la respuesta no es JSON válido', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    });

    const resultado = await service.obtenerJson('http://api-externa/skus');

    expect(resultado).toEqual({
      ok: false,
      error: 'no se pudo conectar a http://api-externa/skus: Unexpected token',
      errorType: 'connection_error',
    });
  });

  it('abre el circuito después de tres fallos y evita nuevas llamadas', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
    });

    await service.obtenerJson('http://api-externa/skus');
    await service.obtenerJson('http://api-externa/skus');
    await service.obtenerJson('http://api-externa/skus');
    const resultado = await service.obtenerJson('http://api-externa/skus');

    expect(resultado).toEqual({
      ok: false,
      error: 'circuito abierto para http://api-externa/skus',
      errorType: 'circuit_open',
    });
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  describe('caos de dependencia (CHAOS_DEPENDENCY_MODE)', () => {
    const url = 'http://api-externa/skus';

    beforeEach(() => {
      process.env.CHAOS_DEPENDENCY_FAILURE = 'true';
      process.env.CHAOS_DEPENDENCY_TARGET = 'api-externa';
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      delete process.env.CHAOS_DEPENDENCY_MODE;
    });

    it('modo hang espera timeoutMs y devuelve ok:false', async () => {
      process.env.CHAOS_DEPENDENCY_MODE = 'hang';
      let resuelto = false;
      const promesa = service.obtenerJson(url, 2000).then((r) => {
        resuelto = true;
        return r;
      });

      await jest.advanceTimersByTimeAsync(1999);
      expect(resuelto).toBe(false);
      await jest.advanceTimersByTimeAsync(1);

      expect(await promesa).toEqual({
        ok: false,
        error: `tiempo de espera agotado llamando a ${url} (caos)`,
        errorType: 'timeout',
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('modo hang es el valor por defecto', async () => {
      const promesa = service.obtenerJson(url, 500);
      await jest.advanceTimersByTimeAsync(500);

      expect(await promesa).toEqual({
        ok: false,
        error: `tiempo de espera agotado llamando a ${url} (caos)`,
        errorType: 'timeout',
      });
    });

    it('modo error falla inmediatamente sin esperar', async () => {
      process.env.CHAOS_DEPENDENCY_MODE = 'error';

      // sin avanzar los timers: si esperara, la promesa no se resolvería
      const resultado = await service.obtenerJson(url, 60_000);

      expect(resultado).toEqual({
        ok: false,
        error: 'dependencia no disponible (caos)',
        errorType: 'connection_error',
      });
    });

    it('con breaker ON, tras 3 fallos en modo hang la 4ª llamada no espera', async () => {
      process.env.CHAOS_DEPENDENCY_MODE = 'hang';

      for (let i = 0; i < 3; i++) {
        const promesa = service.obtenerJson(url, 1000);
        await jest.advanceTimersByTimeAsync(1000);
        await promesa;
      }

      // sin avanzar timers: debe resolverse de inmediato por circuito abierto
      const resultado = await service.obtenerJson(url, 1000);
      expect(resultado).toEqual({
        ok: false,
        error: `circuito abierto para ${url}`,
        errorType: 'circuit_open',
      });
    });

    it('con breaker OFF cada llamada espera el timeout', async () => {
      process.env.CHAOS_DEPENDENCY_MODE = 'hang';
      process.env.RESILIENCE_CIRCUIT_BREAKER_ENABLED = 'false';

      for (let i = 0; i < 4; i++) {
        let resuelto = false;
        const promesa = service.obtenerJson(url, 1000).then((r) => {
          resuelto = true;
          return r;
        });
        await jest.advanceTimersByTimeAsync(999);
        expect(resuelto).toBe(false);
        await jest.advanceTimersByTimeAsync(1);
        expect(await promesa).toEqual({
          ok: false,
          error: `tiempo de espera agotado llamando a ${url} (caos)`,
          errorType: 'timeout',
        });
      }
    });
  });

  it('permite inyectar indisponibilidad de una dependencia mediante entorno', async () => {
    process.env.CHAOS_DEPENDENCY_FAILURE = 'true';
    process.env.CHAOS_DEPENDENCY_TARGET = 'api-externa';
    process.env.CHAOS_DEPENDENCY_MODE = 'error';

    const resultado = await service.obtenerJson('http://api-externa/skus');

    expect(resultado).toEqual({
      ok: false,
      error: 'dependencia no disponible (caos)',
      errorType: 'connection_error',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('permite desactivar el circuito para la línea base del experimento', async () => {
    process.env.RESILIENCE_CIRCUIT_BREAKER_ENABLED = 'false';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
    });

    await service.obtenerJson('http://api-externa/skus');
    await service.obtenerJson('http://api-externa/skus');
    await service.obtenerJson('http://api-externa/skus');
    await service.obtenerJson('http://api-externa/skus');

    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  describe('eventos estructurados del circuit breaker', () => {
    let escrituras: string[];
    let stdoutSpy: jest.SpyInstance;

    beforeEach(() => {
      escrituras = [];
      stdoutSpy = jest
        .spyOn(process.stdout, 'write')
        .mockImplementation((chunk: string | Uint8Array) => {
          escrituras.push(String(chunk));
          return true;
        });
    });

    afterEach(() => stdoutSpy.mockRestore());

    it('emite circuit_breaker_opened al tercer fallo y half_open tras el cooldown', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });
      const url = 'http://api-externa/skus';

      await service.obtenerJson(url);
      await service.obtenerJson(url);
      expect(escrituras).toHaveLength(0);
      await service.obtenerJson(url);

      const eventos = escrituras.map(
        (l) => JSON.parse(l) as Record<string, unknown>,
      );
      expect(eventos).toHaveLength(1);
      expect(eventos[0]).toMatchObject({
        severity: 'WARNING',
        event: 'circuit_breaker_opened',
        url,
        fallos: 3,
        cooldown_ms: 30_000,
      });

      // rechazo rápido: no emite log
      await service.obtenerJson(url);
      expect(escrituras).toHaveLength(1);

      const ahora = Date.now();
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(ahora + 31_000);
      await service.obtenerJson(url);
      dateSpy.mockRestore();

      const eventosFinal = escrituras.map(
        (l) => (JSON.parse(l) as { event: string }).event,
      );
      expect(eventosFinal).toContain('circuit_breaker_half_open');
    });
  });
});
