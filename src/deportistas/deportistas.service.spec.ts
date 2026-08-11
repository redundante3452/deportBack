import { Test, TestingModule } from '@nestjs/testing';
import { DeportistasService } from './services/deportistas.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Deportista } from './entities/deportista.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { UpdateDeportistaDto } from './dto/update-deportista.dto';

describe('DeportistasService', () => {
  let service: DeportistasService;
  let repository: jest.Mocked<Repository<Deportista>>;

  it('debe permitir instanciar UpdateDeportistaDto', () => {
    const dto = new UpdateDeportistaDto();
    expect(dto).toBeDefined();
  });

  const mockDeportista: Deportista = {
    id: 'dep-1',
    nombre: 'Juan Perez',
    email: 'juan@example.com',
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    habitos: [],
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
        DeportistasService,
        {
          provide: getRepositoryToken(Deportista),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DeportistasService>(DeportistasService);
    repository = module.get(getRepositoryToken(Deportista));
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('cheqUser', () => {
    it('debe lanzar ConflictException si el email ya existe', async () => {
      repository.findOne.mockResolvedValue(mockDeportista);
      await expect(service.cheqUser('juan@example.com')).rejects.toThrow(
        ConflictException,
      );
    });

    it('no debe lanzar excepción si el email no existe', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.cheqUser('nuevo@example.com')).resolves.not.toThrow();
    });
  });

  describe('create', () => {
    it('debe crear y guardar un deportista exitosamente', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockDeportista);
      repository.save.mockResolvedValue(mockDeportista);

      const result = await service.create({
        nombre: 'Juan Perez',
        email: 'juan@example.com',
      });

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'juan@example.com' },
      });
      expect(repository.save).toHaveBeenCalledWith(mockDeportista);
      expect(result).toEqual(mockDeportista);
    });
  });

  describe('listar', () => {
    it('debe retornar lista de deportistas con o sin filtros', async () => {
      repository.find.mockResolvedValue([mockDeportista]);

      const result = await service.listar('Juan', 'juan@example.com');

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([mockDeportista]);
    });

    it('debe retornar lista vacía si no hay resultados sin filtros', async () => {
      repository.find.mockResolvedValue([]);
      const result = await service.listar('', '');
      expect(result).toEqual([]);
    });
  });

  describe('buscarAvanzado', () => {
    it('debe llamar a listar con el DTO', async () => {
      repository.find.mockResolvedValue([mockDeportista]);
      const result = await service.buscarAvanzado({
        nombre: 'Juan',
        email: 'juan@example.com',
      });
      expect(result).toEqual([mockDeportista]);
    });
  });

  describe('buscarPorId', () => {
    it('debe retornar un deportista si existe', async () => {
      repository.findOne.mockResolvedValue(mockDeportista);
      const result = await service.buscarPorId('dep-1');
      expect(result).toEqual(mockDeportista);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.buscarPorId('invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reemplazar', () => {
    it('debe reemplazar deportista cambiando email no conflictivo', async () => {
      repository.findOne
        .mockResolvedValueOnce({ ...mockDeportista }) // buscarPorId
        .mockResolvedValueOnce(null); // cheqUser
      repository.save.mockResolvedValue({
        ...mockDeportista,
        email: 'nuevo@example.com',
      });

      const result = await service.reemplazar('dep-1', {
        nombre: 'Juan Actualizado',
        email: 'nuevo@example.com',
      });

      expect(result.email).toBe('nuevo@example.com');
    });

    it('debe reemplazar sin chequear email si este no cambia', async () => {
      repository.findOne.mockResolvedValue({ ...mockDeportista });
      repository.save.mockResolvedValue({ ...mockDeportista });

      const result = await service.reemplazar('dep-1', {
        nombre: 'Juan Mismo Email',
        email: 'juan@example.com',
      });

      expect(result).toBeDefined();
    });
  });

  describe('actualizarParcial', () => {
    it('debe actualizar parcialmente con nuevo email sin conflicto', async () => {
      repository.findOne
        .mockResolvedValueOnce({ ...mockDeportista }) // buscarPorId
        .mockResolvedValueOnce(null); // cheqUser
      repository.save.mockImplementation(async (entity) => entity as Deportista);

      const result = await service.actualizarParcial('dep-1', {
        email: 'cambio@example.com',
      });

      expect(result.email).toBe('cambio@example.com');
    });

    it('debe actualizar parcialmente solo nombre sin chequear email', async () => {
      repository.findOne.mockResolvedValue({ ...mockDeportista });
      repository.save.mockImplementation(async (entity) => entity as Deportista);

      const result = await service.actualizarParcial('dep-1', {
        nombre: 'Nuevo Nombre',
      });

      expect(result.nombre).toBe('Nuevo Nombre');
    });
  });

  describe('eliminar', () => {
    it('debe eliminar un deportista existente', async () => {
      repository.findOne.mockResolvedValue(mockDeportista);
      repository.remove.mockResolvedValue(mockDeportista);

      await service.eliminar('dep-1');

      expect(repository.remove).toHaveBeenCalledWith(mockDeportista);
    });
  });
});

