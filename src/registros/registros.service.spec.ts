import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Registro } from './entities/registro.entity';
import { Habito } from '../habitos/entities/habito.entity';
import { RegistrosService } from './services/registros.service';

describe('RegistrosService', () => {
  let service: RegistrosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrosService,
        {
          provide: getRepositoryToken(Registro),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Habito),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RegistrosService>(RegistrosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
