import { logEstructurado } from './log-estructurado';

describe('logEstructurado', () => {
  it('escribe una sola línea JSON válida con severity, event y timestamp', () => {
    const escrituras: string[] = [];
    const spy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation((chunk: string | Uint8Array) => {
        escrituras.push(String(chunk));
        return true;
      });

    logEstructurado('WARNING', 'evento_prueba', { trace_id: 'abc', n: 2 });
    spy.mockRestore();

    expect(escrituras).toHaveLength(1);
    expect(escrituras[0].endsWith('\n')).toBe(true);
    expect(escrituras[0].trim().split('\n')).toHaveLength(1);
    const json = JSON.parse(escrituras[0]) as Record<string, unknown>;
    expect(json).toMatchObject({
      severity: 'WARNING',
      event: 'evento_prueba',
      trace_id: 'abc',
      n: 2,
    });
    expect(new Date(json.timestamp as string).toISOString()).toBe(
      json.timestamp,
    );
  });
});
