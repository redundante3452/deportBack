import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('API endpoints (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('gestiona deportistas y hábitos', async () => {
    const timestamp = Date.now();
    const deportista = await request(app.getHttpServer())
      .post('/deportistas')
      .send({ nombre: 'Ana', email: `ana_${timestamp}@example.com` })
      .expect(201);

    const deportistaId = deportista.body.id;

    await request(app.getHttpServer())
      .get('/deportistas')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(
          res.body.some((item: { id: string }) => item.id === deportistaId),
        ).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/deportistas/${deportistaId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(deportistaId);
      });

    const habito = await request(app.getHttpServer())
      .post('/habitos')
      .send({
        nombre: 'Correr',
        descripcion: 'Salida matutina',
        frecuencia: 'Diaria',
        deportistaId,
      })
      .expect(201);

    const habitoId = habito.body.id;

    await request(app.getHttpServer())
      .get('/habitos')
      .query({ frecuencia: 'Dia' })
      .expect(200)
      .expect((res) => {
        expect(
          res.body.some((item: { id: string }) => item.id === habitoId),
        ).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/habitos/${habitoId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(habitoId);
      });

    await request(app.getHttpServer())
      .patch(`/habitos/${habitoId}/frecuencia`)
      .send({ frecuencia: 'Semanal' })
      .expect(200)
      .expect((res) => {
        expect(res.body.frecuencia).toBe('Semanal');
      });
  });

  it('gestiona registros y recalcula rachas', async () => {
    const timestamp = Date.now();
    const deportista = await request(app.getHttpServer())
      .post('/deportistas')
      .send({ nombre: 'Luis', email: `luis_${timestamp}@example.com` })
      .expect(201);

    const habito = await request(app.getHttpServer())
      .post('/habitos')
      .send({
        nombre: 'Yoga',
        descripcion: 'Rutina de mañana',
        frecuencia: 'Diaria',
        deportistaId: deportista.body.id,
      })
      .expect(201);

    const firstRecord = await request(app.getHttpServer())
      .post('/registros')
      .send({
        habitoId: habito.body.id,
        fecha: '2026-08-01',
        completado: true,
        duracionMinutos: 30,
        rpe: 7,
        notas: 'Inicio',
      })
      .expect(201);

    const secondRecord = await request(app.getHttpServer())
      .post('/registros')
      .send({
        habitoId: habito.body.id,
        fecha: '2026-08-02',
        completado: false,
        duracionMinutos: 20,
        rpe: 5,
        notas: 'No completado',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/registros')
      .send({
        habitoId: habito.body.id,
        fecha: '2026-08-02',
        completado: false,
        duracionMinutos: 20,
        rpe: 5,
      })
      .expect(409);

    await request(app.getHttpServer())
      .get('/registros')
      .query({
        habitoId: habito.body.id,
        desde: '2026-08-01',
        hasta: '2026-08-31',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(2);
      });

    await request(app.getHttpServer())
      .get(`/registros/${firstRecord.body.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(firstRecord.body.id);
      });

    await request(app.getHttpServer())
      .put(`/registros/${secondRecord.body.id}`)
      .send({
        fecha: '2026-08-02',
        completado: true,
        duracionMinutos: 25,
        rpe: 8,
        notas: 'Corregido',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.completado).toBe(true);
        expect(res.body.duracionMinutos).toBe(25);
      });

    await request(app.getHttpServer())
      .patch(`/registros/${firstRecord.body.id}`)
      .send({
        duracionMinutos: 35,
        notas: 'Ajuste leve',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.duracionMinutos).toBe(35);
      });

    await request(app.getHttpServer())
      .delete(`/registros/${firstRecord.body.id}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/registros/${firstRecord.body.id}`)
      .expect(404);
  });

  it('gestiona errores y búsquedas avanzadas en deportistas y hábitos', async () => {
    const timestamp = Date.now();
    const email = `carlos_${timestamp}@example.com`;

    // 1. Crear deportista inicial
    const depRes = await request(app.getHttpServer())
      .post('/deportistas')
      .send({ nombre: 'Carlos', email })
      .expect(201);

    const depId = depRes.body.id;

    // 2. Error 409 por email duplicado
    await request(app.getHttpServer())
      .post('/deportistas')
      .send({ nombre: 'Carlos Dup', email })
      .expect(409);

    // 3. Búsqueda avanzada de deportistas
    await request(app.getHttpServer())
      .post('/deportistas/buscar')
      .send({ nombre: 'Carlos', email })
      .expect(201)
      .expect((res) => {
        expect(res.body.some((d: { id: string }) => d.id === depId)).toBe(true);
      });

    // 4. Reemplazar (PUT) deportista
    const nuevoEmail = `carlos_nuevo_${timestamp}@example.com`;
    await request(app.getHttpServer())
      .put(`/deportistas/${depId}`)
      .send({ nombre: 'Carlos Reemplazado', email: nuevoEmail })
      .expect(200)
      .expect((res) => {
        expect(res.body.nombre).toBe('Carlos Reemplazado');
      });

    // 5. Actualización parcial (PATCH) deportista
    await request(app.getHttpServer())
      .patch(`/deportistas/${depId}`)
      .send({ nombre: 'Carlos Patched' })
      .expect(200)
      .expect((res) => {
        expect(res.body.nombre).toBe('Carlos Patched');
      });

    // 6. Error 404 al buscar ID inexistente
    await request(app.getHttpServer())
      .get('/deportistas/00000000-0000-0000-0000-000000000000')
      .expect(404);

    // 7. Crear hábito
    const habRes = await request(app.getHttpServer())
      .post('/habitos')
      .send({
        nombre: 'Ciclismo',
        descripcion: 'Ruta 20km',
        frecuencia: 'Semanal',
        deportistaId: depId,
      })
      .expect(201);

    const habId = habRes.body.id;

    // 8. Error 409 por hábito duplicado para el mismo deportista
    await request(app.getHttpServer())
      .post('/habitos')
      .send({
        nombre: 'Ciclismo',
        descripcion: 'Otra ruta',
        frecuencia: 'Semanal',
        deportistaId: depId,
      })
      .expect(409);

    // 9. Búsqueda avanzada de hábitos
    await request(app.getHttpServer())
      .post('/habitos/buscar')
      .send({ nombre: 'Ciclismo', deportistaId: depId })
      .expect(201)
      .expect((res) => {
        expect(res.body.some((h: { id: string }) => h.id === habId)).toBe(true);
      });

    // 10. Reemplazar (PUT) hábito
    await request(app.getHttpServer())
      .put(`/habitos/${habId}`)
      .send({
        nombre: 'Ciclismo Avanzado',
        descripcion: 'Ruta 40km',
        frecuencia: 'Semanal',
        deportistaId: depId,
        rachaActual: 2,
        rachaMaxima: 5,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.nombre).toBe('Ciclismo Avanzado');
      });

    // 11. Error 404 para hábito inexistente
    await request(app.getHttpServer())
      .get('/habitos/00000000-0000-0000-0000-000000000000')
      .expect(404);

    // 12. Error 404 al crear registro para hábito inexistente
    await request(app.getHttpServer())
      .post('/registros')
      .send({
        habitoId: '00000000-0000-0000-0000-000000000000',
        fecha: '2026-08-10',
        completado: true,
        duracionMinutos: 30,
        rpe: 7,
      })
      .expect(404);

    // 13. Error 400 en /logros sin query params
    await request(app.getHttpServer()).get('/logros').expect(400);

    // 14. Búsqueda de /logros por deportistaId
    await request(app.getHttpServer())
      .get('/logros')
      .query({ deportistaId: depId })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });

    // 15. Eliminar hábito y deportista
    await request(app.getHttpServer()).delete(`/habitos/${habId}`).expect(200);
    await request(app.getHttpServer())
      .delete(`/deportistas/${depId}`)
      .expect(200);
  });
});
