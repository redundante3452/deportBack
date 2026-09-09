import { Injectable } from '@nestjs/common';
import { ResultadoHttpExterno } from './http-externo.types';

@Injectable()
export class HttpExternoService {
  async obtenerJson(url: string): Promise<ResultadoHttpExterno> {
    const respuesta = await fetch(url);
    const data = await respuesta.json();
    return { ok: true, data };
  }
}
