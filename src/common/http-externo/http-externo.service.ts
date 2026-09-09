import { Injectable } from '@nestjs/common';
import { ResultadoHttpExterno } from './http-externo.types';

@Injectable()
export class HttpExternoService {
  async obtenerJson(url: string): Promise<ResultadoHttpExterno> {
    return { ok: false, error: 'no implementado' };
  }
}
