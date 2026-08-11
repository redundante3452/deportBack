import { Test, TestingModule } from '@nestjs/testing';
import { DeportistasController } from './controllers/deportistas.controller';
import { DeportistasService } from './services/deportistas.service';

describe('DeportistasController', () => {
  let controller: DeportistasController;
  let service: jest.Mocked<DeportistasService>;

  const mockDeportista = {
    id: 'dep-1',
    nombre: 'Ana',
    email: 'ana@example.com',
    creadoEn: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      listar: jest.fn(),
      buscarAvanzado: jest.fn(),
      buscarPorId: jest.fn(),
      reemplazar: jest.fn(),
      actualizarParcial: jest.fn(),
      eliminar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeportistasController],
      providers: [
        {
          provide: DeportistasService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DeportistasController>(DeportistasController);
    service = module.get(DeportistasService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe crear un deportista', async () => {
    service.create.mockResolvedValue(mockDeportista);
    const dto = { nombre: 'Ana', email: 'ana@example.com' };
    const res = await controller.crearDeportista(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual(mockDeportista);
  });

  it('debe listar deportistas', async () => {
    service.listar.mockResolvedValue([mockDeportista]);
    const res = await controller.listarDeportistas('Ana', 'ana@example.com');
    expect(service.listar).toHaveBeenCalledWith('Ana', 'ana@example.com');
    expect(res).toEqual([mockDeportista]);
  });

  it('debe buscar avanzado', async () => {
    service.buscarAvanzado.mockResolvedValue([mockDeportista]);
    const dto = { nombre: 'Ana', email: 'ana@example.com' };
    const res = await controller.buscarAvanzado(dto);
    expect(service.buscarAvanzado).toHaveBeenCalledWith(dto);
    expect(res).toEqual([mockDeportista]);
  });

  it('debe buscar por id', async () => {
    service.buscarPorId.mockResolvedValue(mockDeportista);
    const res = await controller.buscarPorId('dep-1');
    expect(service.buscarPorId).toHaveBeenCalledWith('dep-1');
    expect(res).toEqual(mockDeportista);
  });

  it('debe reemplazar deportista', async () => {
    service.reemplazar.mockResolvedValue(mockDeportista);
    const dto = { nombre: 'Ana Mod', email: 'ana@example.com' };
    const res = await controller.reemplazar('dep-1', dto);
    expect(service.reemplazar).toHaveBeenCalledWith('dep-1', dto);
    expect(res).toEqual(mockDeportista);
  });

  it('debe actualizar parcialmente deportista', async () => {
    service.actualizarParcial.mockResolvedValue(mockDeportista);
    const dto = { nombre: 'Ana Patch' };
    const res = await controller.actualizarParcial('dep-1', dto);
    expect(service.actualizarParcial).toHaveBeenCalledWith('dep-1', dto);
    expect(res).toEqual(mockDeportista);
  });

  it('debe eliminar deportista', async () => {
    service.eliminar.mockResolvedValue(undefined);
    await controller.eliminar('dep-1');
    expect(service.eliminar).toHaveBeenCalledWith('dep-1');
  });
});
