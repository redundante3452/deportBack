import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Habito } from './entities/habito.entity';
import { HabitosService } from './services/habitos.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('HabitosService', () => {
  let service: HabitosService;
  let repository: jest.Mocked<Repository<Habito>>;

  const mockHabito: Habito = {
    id: 'hab-1',
    nombre: 'Correr',
    descripcion: 'Matutino',
    frecuencia: 'Diaria',
    rachaActual: 5,
    rachaMaxima: 10,
    deportistaId: 'dep-1',
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    deportista: null,
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitosService,
        {
          provide: getRepositoryToken(Habito),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HabitosService>(HabitosService);
    repository = module.get(getRepositoryToken(Habito));
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('cheqHabito', () => {
    it('debe lanzar ConflictException si el hábito existe y su id es distinto a excludeId', async () => {
      repository.findOne.mockResolvedValue(mockHabito);
      await expect(
        service.cheqHabito('Correr', 'dep-1', 'distinto-id'),
      ).rejects.toThrow(ConflictException);
    });

    it('no debe lanzar excepción si el hábito pertenece al mismo excludeId', async () => {
      repository.findOne.mockResolvedValue(mockHabito);
      await expect(
        service.cheqHabito('Correr', 'dep-1', 'hab-1'),
      ).resolves.not.toThrow();
    });

    it('no debe lanzar excepción si el hábito no existe', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.cheqHabito('Nuevo', 'dep-1')).resolves.not.toThrow();
    });
  });

  describe('create', () => {
    it('debe crear un hábito con rachaActual y rachaMaxima en 0', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockHabito);
      repository.save.mockResolvedValue(mockHabito);

      const result = await service.create({
        nombre: 'Correr',
        descripcion: 'Matutino',
        frecuencia: 'Diaria',
        deportistaId: 'dep-1',
      });

      expect(repository.create).toHaveBeenCalledWith({
        nombre: 'Correr',
        descripcion: 'Matutino',
        frecuencia: 'Diaria',
        deportistaId: 'dep-1',
        rachaActual: 0,
        rachaMaxima: 0,
      });
      expect(result).toEqual(mockHabito);
    });
  });

  describe('listar', () => {
    it('debe retornar hábitos filtrados o todos', async () => {
      repository.find.mockResolvedValue([mockHabito]);
      const result = await service.listar('Diaria', 'dep-1');
      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([mockHabito]);
    });
  });

  describe('buscarAvanzado', () => {
    it('debe buscar hábitos por criterios avanzados', async () => {
      repository.find.mockResolvedValue([mockHabito]);
      const result = await service.buscarAvanzado({
        nombre: 'Correr',
        frecuencia: 'Diaria',
        deportistaId: 'dep-1',
        rachaActual: 5,
      });
      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([mockHabito]);
    });
  });

  describe('buscarPorId', () => {
    it('debe retornar hábito por id si existe', async () => {
      repository.findOne.mockResolvedValue(mockHabito);
      const result = await service.buscarPorId('hab-1');
      expect(result).toEqual(mockHabito);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.buscarPorId('invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reemplazar', () => {
    it('debe reemplazar hábito validando duplicados al cambiar nombre', async () => {
      repository.findOne
        .mockResolvedValueOnce(mockHabito) // buscarPorId
        .mockResolvedValueOnce(null); // cheqHabito
      repository.save.mockResolvedValue({
        ...mockHabito,
        nombre: 'Nuevo Nombre',
      });

      const result = await service.reemplazar('hab-1', {
        nombre: 'Nuevo Nombre',
        descripcion: 'Desc',
        frecuencia: 'Semanal',
        deportistaId: 'dep-1',
        rachaActual: 0,
        rachaMaxima: 0,
      });

      expect(result.nombre).toBe('Nuevo Nombre');
    });

    it('debe reemplazar sin chequear duplicados si no cambia nombre ni deportistaId', async () => {
      repository.findOne.mockResolvedValue(mockHabito);
      repository.save.mockResolvedValue(mockHabito);

      const result = await service.reemplazar('hab-1', {
        nombre: 'Correr',
        descripcion: 'Nueva Desc',
        frecuencia: 'Mensual',
        deportistaId: 'dep-1',
        rachaActual: 5,
        rachaMaxima: 10,
      });

      expect(result).toBeDefined();
    });
  });

  describe('actualizarFrecuencia', () => {
    it('debe actualizar únicamente la frecuencia del hábito', async () => {
      repository.findOne.mockResolvedValue({ ...mockHabito });
      repository.save.mockImplementation((entity) =>
        Promise.resolve(entity as Habito),
      );

      const result = await service.actualizarFrecuencia('hab-1', {
        frecuencia: 'Semanal',
      });

      expect(result.frecuencia).toBe('Semanal');
    });
  });

  describe('eliminar', () => {
    it('debe eliminar hábito existente', async () => {
      repository.findOne.mockResolvedValue(mockHabito);
      repository.remove.mockResolvedValue(mockHabito);

      await service.eliminar('hab-1');

      expect(repository.remove).toHaveBeenCalledWith(mockHabito);
    });
  });
});
