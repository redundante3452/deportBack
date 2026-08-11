import { Test, TestingModule } from '@nestjs/testing';
import { DeportistasService } from './services/deportistas.service';

describe('DeportistasService', () => {
  let service: DeportistasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeportistasService],
    }).compile();

    service = module.get<DeportistasService>(DeportistasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
