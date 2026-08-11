import { Test, TestingModule } from '@nestjs/testing';
import { DeportistasController } from './controllers/deportistas.controller';
import { DeportistasService } from './services/deportistas.service';

describe('DeportistasController', () => {
  let controller: DeportistasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeportistasController],
      providers: [DeportistasService],
    }).compile();

    controller = module.get<DeportistasController>(DeportistasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
