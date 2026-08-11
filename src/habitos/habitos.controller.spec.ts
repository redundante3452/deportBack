import { Test, TestingModule } from '@nestjs/testing';
import { HabitosController } from './controllers/habitos.controller';
import { HabitosService } from './services/habitos.service';

describe('HabitosController', () => {
  let controller: HabitosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HabitosController],
      providers: [
        {
          provide: HabitosService,
          useValue: {
            create: jest.fn(),
            listar: jest.fn(),
            buscarAvanzado: jest.fn(),
            buscarPorId: jest.fn(),
            reemplazar: jest.fn(),
            actualizarFrecuencia: jest.fn(),
            eliminar: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HabitosController>(HabitosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
