import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Registro } from './entities/registro.entity';
import { Habito } from '../habitos/entities/habito.entity';
import { RegistrosService } from './services/registros.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';

describe('RegistrosService', () => {
  let service: RegistrosService;
  let registroRepo: jest.Mocked<Repository<Registro>>;
  let habitoRepo: jest.Mocked<Repository<Habito>>;

  const mockHabito: Habito = {
    id: 'hab-1',
    nombre: 'Nadar',
    descripcion: 'Sesión',
    frecuencia: 'Diaria',
    rachaActual: 0,
    rachaMaxima: 0,
    deportistaId: 'dep-1',
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    deportista: null,
    registros: [],
  };

  const mockRegistro: Registro = {
    id: 'reg-1',
    fecha: '2026-08-01',
    completado: true,
    duracionMinutos: 30,
    rpe: 8,
    notas: 'Buen entreno',
    habitoId: 'hab-1',
    habito: mockHabito,
  };

  beforeEach(async () => {
    const mockRegistroRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockHabitoRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrosService,
        {
          provide: getRepositoryToken(Registro),
          useValue: mockRegistroRepo,
        },
        {
          provide: getRepositoryToken(Habito),
          useValue: mockHabitoRepo,
        },
      ],
    }).compile();

    service = module.get<RegistrosService>(RegistrosService);
    registroRepo = module.get(getRepositoryToken(Registro));
    habitoRepo = module.get(getRepositoryToken(Habito));
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe lanzar NotFoundException si el hábito no existe', async () => {
      habitoRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create({
          habitoId: 'invalido',
          fecha: '2026-08-01',
          completado: true,
          duracionMinutos: 30,
          rpe: 8,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si ya existe un registro en esa fecha', async () => {
      habitoRepo.findOne.mockResolvedValue(mockHabito);
      registroRepo.findOne.mockResolvedValue(mockRegistro);

      await expect(
        service.create({
          habitoId: 'hab-1',
          fecha: '2026-08-01',
          completado: true,
          duracionMinutos: 30,
          rpe: 8,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear un registro y recalcular rachas cuando los datos son válidos', async () => {
      habitoRepo.findOne.mockResolvedValue(mockHabito);
      registroRepo.findOne.mockResolvedValue(null); // No duplicado
      registroRepo.create.mockReturnValue(mockRegistro);
      registroRepo.save.mockResolvedValue(mockRegistro);
      registroRepo.find.mockResolvedValue([mockRegistro]); // para recalcularRachas

      const result = await service.create({
        habitoId: 'hab-1',
        fecha: '2026-08-01',
        completado: true,
        duracionMinutos: 30,
        rpe: 8,
      });

      expect(registroRepo.save).toHaveBeenCalled();
      expect(habitoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ rachaActual: 1, rachaMaxima: 1 }),
      );
      expect(result).toEqual(mockRegistro);
    });
  });

  describe('recalcularRachas', () => {
    it('debe reiniciar racha cuando un registro no es completado y acumular en días consecutivos', async () => {
      habitoRepo.findOne.mockResolvedValue(mockHabito);

      const reg1 = { ...mockRegistro, fecha: '2026-08-01', completado: true };
      const reg2 = {
        ...mockRegistro,
        id: 'reg-2',
        fecha: '2026-08-02',
        completado: true,
      };
      const reg3 = {
        ...mockRegistro,
        id: 'reg-3',
        fecha: '2026-08-03',
        completado: false,
      };
      const reg4 = {
        ...mockRegistro,
        id: 'reg-4',
        fecha: '2026-08-04',
        completado: true,
      };

      registroRepo.find.mockResolvedValue([reg1, reg2, reg3, reg4]);

      // Ejecutar indirectamente vía actualizarCompleto o eliminar
      registroRepo.findOne.mockResolvedValue(reg4);
      registroRepo.save.mockResolvedValue(reg4);

      await service.actualizarCompleto('reg-4', { completado: true });

      expect(habitoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ rachaActual: 1, rachaMaxima: 2 }),
      );
    });

    it('debe manejar días discontinuos reiniciando la racha actual a 1', async () => {
      habitoRepo.findOne.mockResolvedValue(mockHabito);

      const reg1 = { ...mockRegistro, fecha: '2026-08-01', completado: true };
      const reg2 = {
        ...mockRegistro,
        id: 'reg-2',
        fecha: '2026-08-05',
        completado: true,
      };

      registroRepo.find.mockResolvedValue([reg1, reg2]);
      registroRepo.findOne.mockResolvedValue(reg2);
      registroRepo.save.mockResolvedValue(reg2);

      await service.actualizarCompleto('reg-2', { completado: true });

      expect(habitoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ rachaActual: 1, rachaMaxima: 1 }),
      );
    });
  });

  describe('historial', () => {
    it('debe filtrar registros con QueryBuilder', async () => {
      const mockQueryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockRegistro]),
      };
      registroRepo.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<Registro>,
      );

      const result = await service.historial({
        habitoId: 'hab-1',
        desde: '2026-08-01',
        hasta: '2026-08-31',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
      expect(result).toEqual([mockRegistro]);
    });
  });

  describe('buscarPorId', () => {
    it('debe retornar un registro si existe', async () => {
      registroRepo.findOne.mockResolvedValue(mockRegistro);
      const result = await service.buscarPorId('reg-1');
      expect(result).toEqual(mockRegistro);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      registroRepo.findOne.mockResolvedValue(null);
      await expect(service.buscarPorId('invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('actualizarParcial', () => {
    it('debe actualizar duracionMinutos y notas', async () => {
      registroRepo.findOne.mockResolvedValue({ ...mockRegistro });
      registroRepo.save.mockImplementation((r) =>
        Promise.resolve(r as Registro),
      );

      const result = await service.actualizarParcial('reg-1', {
        duracionMinutos: 45,
        notas: 'Nuevas notas',
      });

      expect(result.duracionMinutos).toBe(45);
      expect(result.notas).toBe('Nuevas notas');
    });
  });

  describe('eliminar', () => {
    it('debe eliminar registro y recalcular rachas', async () => {
      registroRepo.findOne.mockResolvedValue(mockRegistro);
      registroRepo.remove.mockResolvedValue(mockRegistro);
      habitoRepo.findOne.mockResolvedValue(mockHabito);
      registroRepo.find.mockResolvedValue([]); // ya no quedan registros

      await service.eliminar('reg-1');

      expect(registroRepo.remove).toHaveBeenCalledWith(mockRegistro);
      expect(habitoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ rachaActual: 0, rachaMaxima: 0 }),
      );
    });
  });
});
