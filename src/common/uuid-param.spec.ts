import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DeportistasController } from '../deportistas/controllers/deportistas.controller';
import { DeportistasV2Controller } from '../deportistas/controllers/deportistas-v2.controller';
import { DeportistasV3Controller } from '../deportistas/controllers/deportistas-v3.controller';
import { DeportistasService } from '../deportistas/services/deportistas.service';
import { HabitosController } from '../habitos/controllers/habitos.controller';
import { HabitosService } from '../habitos/services/habitos.service';
import { RegistrosController } from '../registros/controllers/registros.controller';
import { RegistrosService } from '../registros/services/registros.service';

describe('Validación de :id UUID en controladores', () => {
  let app: INestApplication;
  const servicio = { buscarPorId: jest.fn(), eliminar: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        DeportistasController,
        DeportistasV2Controller,
        DeportistasV3Controller,
        HabitosController,
        RegistrosController,
      ],
      providers: [
        { provide: DeportistasService, useValue: servicio },
        { provide: HabitosService, useValue: servicio },
        { provide: RegistrosService, useValue: servicio },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    '/deportistas/1',
    '/api/v2/deportistas/top',
    '/habitos/1',
    '/registros/1',
  ])('GET %s devuelve 400', async (ruta) => {
    await request(app.getHttpServer()).get(ruta).expect(400);
    expect(servicio.buscarPorId).not.toHaveBeenCalled();
  });

  it('DELETE /api/v3/deportistas/1 devuelve 400', async () => {
    await request(app.getHttpServer())
      .delete('/api/v3/deportistas/1')
      .expect(400);
  });

  it('un UUID válido llega al servicio', async () => {
    servicio.buscarPorId.mockResolvedValue({ id: 'x' });
    await request(app.getHttpServer())
      .get('/deportistas/123e4567-e89b-42d3-a456-426614174000')
      .expect(200);
  });
});
