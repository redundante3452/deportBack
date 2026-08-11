import { Test, TestingModule } from '@nestjs/testing';
import { LogrosController } from './controllers/logros.controller';
import { LogrosService } from './services/logros.service';

describe('LogrosController', () => {
  let controller: LogrosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogrosController],
      providers: [
        {
          provide: LogrosService,
          useValue: {
            buscar: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LogrosController>(LogrosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
