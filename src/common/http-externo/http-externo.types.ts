export type ResultadoHttpExterno =
  | { ok: true; data: unknown }
  | { ok: false; error: string };
