import { Test, TestingModule } from '@nestjs/testing';
import { DeportistasService } from './services/deportistas.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Deportista } from './entities/deportista.entity';

describe('DeportistasService', () => {
  let service: DeportistasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeportistasService,
        {
          provide: getRepositoryToken(Deportista),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DeportistasService>(DeportistasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
