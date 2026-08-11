import { Test, TestingModule } from '@nestjs/testing';
import { RegistrosController } from './controllers/registros.controller';
import { RegistrosService } from './services/registros.service';

describe('RegistrosController', () => {
  let controller: RegistrosController;
  let service: jest.Mocked<RegistrosService>;

  const mockRegistro = {
    id: 'reg-1',
    fecha: '2026-08-01',
    completado: true,
    duracionMinutos: 30,
    rpe: 8,
    notas: 'Notas',
    habitoId: 'hab-1',
    habito: null as any,
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      historial: jest.fn(),
      buscarPorId: jest.fn(),
      actualizarCompleto: jest.fn(),
      actualizarParcial: jest.fn(),
      eliminar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrosController],
      providers: [
        {
          provide: RegistrosService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<RegistrosController>(RegistrosController);
    service = module.get(RegistrosService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe crear un registro', async () => {
    service.create.mockResolvedValue(mockRegistro);
    const dto = {
      habitoId: 'hab-1',
      fecha: '2026-08-01',
      completado: true,
      duracionMinutos: 30,
      rpe: 8,
    };
    const res = await controller.crearRegistro(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual(mockRegistro);
  });

  it('debe consultar historial', async () => {
    service.historial.mockResolvedValue([mockRegistro]);
    const dto = { habitoId: 'hab-1', desde: '2026-08-01', hasta: '2026-08-31' };
    const res = await controller.historial(dto);
    expect(service.historial).toHaveBeenCalledWith(dto);
    expect(res).toEqual([mockRegistro]);
  });

  it('debe obtener detalle de registro', async () => {
    service.buscarPorId.mockResolvedValue(mockRegistro);
    const res = await controller.detalle('reg-1');
    expect(service.buscarPorId).toHaveBeenCalledWith('reg-1');
    expect(res).toEqual(mockRegistro);
  });

  it('debe actualizar completo', async () => {
    service.actualizarCompleto.mockResolvedValue(mockRegistro);
    const dto = {
      fecha: '2026-08-01',
      completado: true,
      duracionMinutos: 40,
      rpe: 9,
    };
    const res = await controller.actualizarCompleto('reg-1', dto);
    expect(service.actualizarCompleto).toHaveBeenCalledWith('reg-1', dto);
    expect(res).toEqual(mockRegistro);
  });

  it('debe actualizar parcial', async () => {
    service.actualizarParcial.mockResolvedValue(mockRegistro);
    const dto = { duracionMinutos: 45, notas: 'Ajuste' };
    const res = await controller.actualizarParcial('reg-1', dto);
    expect(service.actualizarParcial).toHaveBeenCalledWith('reg-1', dto);
    expect(res).toEqual(mockRegistro);
  });

  it('debe eliminar registro', async () => {
    service.eliminar.mockResolvedValue(undefined);
    await controller.eliminar('reg-1');
    expect(service.eliminar).toHaveBeenCalledWith('reg-1');
  });
});

