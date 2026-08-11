import { Test, TestingModule } from '@nestjs/testing';
import { LogrosController } from './controllers/logros.controller';
import { LogrosService } from './services/logros.service';

describe('LogrosController', () => {
  let controller: LogrosController;
  let service: jest.Mocked<LogrosService>;

  beforeEach(async () => {
    const mockService = {
      buscar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogrosController],
      providers: [
        {
          provide: LogrosService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<LogrosController>(LogrosController);
    service = module.get(LogrosService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe buscar logros pasando el DTO', async () => {
    const mockLogros = [
      {
        codigo: 'racha-7',
        nombre: 'Racha de 7 días',
        descripcion: 'Desc',
        habitoId: 'hab-1',
        habitoNombre: 'Correr',
      },
    ];
    service.buscar.mockResolvedValue(mockLogros);

    const dto = { habitoId: 'hab-1' };
    const res = await controller.buscar(dto);

    expect(service.buscar).toHaveBeenCalledWith(dto);
    expect(res).toEqual(mockLogros);
  });
});
