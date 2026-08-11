import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Habito } from '../habitos/entities/habito.entity';
import { Registro } from '../registros/entities/registro.entity';
import { LogrosService } from './services/logros.service';

describe('LogrosService', () => {
  let service: LogrosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogrosService,
        {
          provide: getRepositoryToken(Habito),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Registro),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LogrosService>(LogrosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
