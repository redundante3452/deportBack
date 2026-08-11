import { Test, TestingModule } from '@nestjs/testing';
import { RegistrosController } from './controllers/registros.controller';
import { RegistrosService } from './services/registros.service';

describe('RegistrosController', () => {
  let controller: RegistrosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrosController],
      providers: [
        {
          provide: RegistrosService,
          useValue: {
            create: jest.fn(),
            historial: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RegistrosController>(RegistrosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
