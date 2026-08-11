import { Test, TestingModule } from '@nestjs/testing';
import { DeportistasController } from './controllers/deportistas.controller';
import { DeportistasService } from './services/deportistas.service';

describe('DeportistasController', () => {
  let controller: DeportistasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeportistasController],
<<<<<<< HEAD
      providers: [DeportistasService],
=======
      providers: [
        {
          provide: DeportistasService,
          useValue: {
            create: jest.fn(),  
            listar: jest.fn(),
            buscarAvanzado: jest.fn(),
            buscarPorId: jest.fn(),
            reemplazar: jest.fn(),
            actualizarParcial: jest.fn(),
            eliminar: jest.fn(),
          },
        },
      ],
>>>>>>> feature/hu-02-crud-habito
    }).compile();

    controller = module.get<DeportistasController>(DeportistasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
