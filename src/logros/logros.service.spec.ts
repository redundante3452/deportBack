import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Habito } from '../habitos/entities/habito.entity';
import { Registro } from '../registros/entities/registro.entity';
import { LogrosService } from './services/logros.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('LogrosService', () => {
  let service: LogrosService;
  let habitoRepo: jest.Mocked<Repository<Habito>>;
  let registroRepo: jest.Mocked<Repository<Registro>>;

  const mockHabito: Habito = {
    id: 'hab-1',
    nombre: 'Correr matutino',
    descripcion: 'Rutina',
    frecuencia: 'Diaria',
    rachaActual: 30,
    rachaMaxima: 35,
    deportistaId: 'dep-1',
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    deportista: null,
  };

  beforeEach(async () => {
    const mockHabitoRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockRegistroRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogrosService,
        {
          provide: getRepositoryToken(Habito),
          useValue: mockHabitoRepo,
        },
        {
          provide: getRepositoryToken(Registro),
          useValue: mockRegistroRepo,
        },
      ],
    }).compile();

    service = module.get<LogrosService>(LogrosService);
    habitoRepo = module.get(getRepositoryToken(Habito));
    registroRepo = module.get(getRepositoryToken(Registro));
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('buscar', () => {
    it('debe lanzar BadRequestException si no se envía habitoId ni deportistaId', async () => {
      await expect(service.buscar({})).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si el hábito buscado por habitoId no existe', async () => {
      habitoRepo.findOne.mockResolvedValue(null);
      await expect(service.buscar({ habitoId: 'invalido' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe calcular logros para un habitoId (racha 7 y 30)', async () => {
      habitoRepo.findOne.mockResolvedValue(mockHabito);
      registroRepo.find.mockResolvedValue([]); // sin registros para no cumplir rpe-alto ni cumplimiento-total

      const logros = await service.buscar({ habitoId: 'hab-1' });

      const codigos = logros.map((l) => l.codigo);
      expect(codigos).toContain('racha-7');
      expect(codigos).toContain('racha-30');
      expect(codigos).not.toContain('racha-100');
    });

    it('debe calcular logros racha-100 si la rachaMaxima es >= 100', async () => {
      const habito100 = { ...mockHabito, rachaMaxima: 105 };
      habitoRepo.findOne.mockResolvedValue(habito100);
      registroRepo.find.mockResolvedValue([]);

      const logros = await service.buscar({ habitoId: 'hab-1' });
      const codigos = logros.map((l) => l.codigo);
      expect(codigos).toContain('racha-100');
    });

    it('debe calcular logro cumplimiento-total y rpe-alto', async () => {
      habitoRepo.findOne.mockResolvedValue(mockHabito);

      const registrosMock: Partial<Registro>[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `reg-${i + 1}`,
          fecha: `2026-08-${String(i + 1).padStart(2, '0')}`,
          completado: true,
          rpe: 9,
        }),
      );

      registroRepo.find.mockResolvedValue(registrosMock as Registro[]);

      const logros = await service.buscar({ habitoId: 'hab-1' });
      const codigos = logros.map((l) => l.codigo);

      expect(codigos).toContain('cumplimiento-total');
      expect(codigos).toContain('rpe-alto');
    });

    it('debe reiniciar rachaRPEAlto si un registro no está completado o tiene rpe < 8', async () => {
      habitoRepo.findOne.mockResolvedValue({ ...mockHabito, rachaMaxima: 0 });

      const registrosMock: Partial<Registro>[] = [
        { fecha: '2026-08-01', completado: true, rpe: 9 },
        { fecha: '2026-08-02', completado: false, rpe: 9 }, // rompe racha
        { fecha: '2026-08-03', completado: true, rpe: 5 }, // rpe bajo
      ];

      registroRepo.find.mockResolvedValue(registrosMock as Registro[]);

      const logros = await service.buscar({ habitoId: 'hab-1' });
      expect(logros).toEqual([]);
    });

    it('debe buscar logros agregados para todos los hábitos de un deportistaId', async () => {
      habitoRepo.find.mockResolvedValue([mockHabito]);
      registroRepo.find.mockResolvedValue([]);

      const logros = await service.buscar({ deportistaId: 'dep-1' });

      expect(habitoRepo.find).toHaveBeenCalledWith({
        where: { deportistaId: 'dep-1' },
        order: { creadoEn: 'DESC' },
      });
      expect(logros.length).toBeGreaterThan(0);
    });
  });
});
