import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Habito } from './entities/habito.entity';
import { HabitosService } from './services/habitos.service';

describe('HabitosService', () => {
  let service: HabitosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitosService,
        {
          provide: getRepositoryToken(Habito),
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

    service = module.get<HabitosService>(HabitosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
