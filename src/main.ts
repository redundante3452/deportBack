import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AppModule } from './app.module';
import { DeportistasService } from './deportistas/services/deportistas.service';
import { BuscarDeportistasDto } from './deportistas/dto/buscar-deportistas.dto';
import { HabitosService } from './habitos/services/habitos.service';
import { BuscarHabitosDto } from './habitos/dto/buscar-habitos.dto';
import { RegistrosService } from './registros/services/registros.service';
import { BuscarRegistrosDto } from './registros/dto/buscar-registros.dto';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  registrarRutasQuery(app);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

/**
 * Registra las rutas que usan el método HTTP QUERY (RFC 10008), soportado
 * de forma nativa por Fastify vía addHttpMethod. Como QUERY vive por fuera
 * del set de decoradores de Nest (@Get, @Post, etc.), se engancha
 * directamente contra la instancia de Fastify y se valida el DTO a mano
 * con class-validator, reusando los mismos services que ya usan los
 * endpoints POST /buscar equivalentes.
 */
function registrarRutasQuery(app: NestFastifyApplication) {
  const fastify = app.getHttpAdapter().getInstance();
  const deportistasService = app.get(DeportistasService);
  const habitosService = app.get(HabitosService);
  const registrosService = app.get(RegistrosService);

  fastify.route({
    method: 'QUERY',
    url: '/deportistas',
    handler: async (request, reply) => {
      const dto = plainToInstance(BuscarDeportistasDto, request.body ?? {});
      const errores = await validate(dto, { whitelist: true });

      if (errores.length > 0) {
        return reply.status(400).send({
          statusCode: 400,
          message: errores
            .flatMap((error) => Object.values(error.constraints ?? {}))
            .join(', '),
        });
      }

      const resultado = await deportistasService.buscarAvanzado(dto);
      return reply.status(200).send(resultado);
    },
  });

  fastify.route({
    method: 'QUERY',
    url: '/habitos',
    handler: async (request, reply) => {
      const dto = plainToInstance(BuscarHabitosDto, request.body ?? {});
      const errores = await validate(dto, { whitelist: true });

      if (errores.length > 0) {
        return reply.status(400).send({
          statusCode: 400,
          message: errores
            .flatMap((error) => Object.values(error.constraints ?? {}))
            .join(', '),
        });
      }

      const resultado = await habitosService.buscarAvanzado(dto);
      return reply.status(200).send(resultado);
    },
  });

  fastify.route({
    method: 'QUERY',
    url: '/registros',
    handler: async (request, reply) => {
      const dto = plainToInstance(BuscarRegistrosDto, request.body ?? {});
      const errores = await validate(dto, { whitelist: true });

      if (errores.length > 0) {
        return reply.status(400).send({
          statusCode: 400,
          message: errores
            .flatMap((error) => Object.values(error.constraints ?? {}))
            .join(', '),
        });
      }

      const resultado = await registrosService.historial(dto);
      return reply.status(200).send(resultado);
    },
  });
}

void bootstrap();
