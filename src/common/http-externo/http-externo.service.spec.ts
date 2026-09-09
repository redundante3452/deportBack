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
  });

  afterAll(() => {
    global.fetch = fetchOriginal;
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
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
    });
  });
});
