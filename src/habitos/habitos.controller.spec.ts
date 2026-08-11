import { Test, TestingModule } from '@nestjs/testing';
import { HabitosController } from './controllers/habitos.controller';
import { HabitosService } from './services/habitos.service';

describe('HabitosController', () => {
  let controller: HabitosController;
  let service: jest.Mocked<HabitosService>;

  const mockHabito = {
    id: 'hab-1',
    nombre: 'Correr',
    descripcion: 'Matutino',
    frecuencia: 'Diaria',
    rachaActual: 0,
    rachaMaxima: 0,
    deportistaId: 'dep-1',
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    deportista: null as any,
    registros: [],
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      listar: jest.fn(),
      buscarAvanzado: jest.fn(),
      buscarPorId: jest.fn(),
      reemplazar: jest.fn(),
      actualizarFrecuencia: jest.fn(),
      eliminar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HabitosController],
      providers: [
        {
          provide: HabitosService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<HabitosController>(HabitosController);
    service = module.get(HabitosService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe crear hábito', async () => {
    service.create.mockResolvedValue(mockHabito);
    const dto = {
      nombre: 'Correr',
      descripcion: 'Matutino',
      frecuencia: 'Diaria',
      deportistaId: 'dep-1',
    };
    const res = await controller.crearHabito(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual(mockHabito);
  });

  it('debe listar hábitos', async () => {
    service.listar.mockResolvedValue([mockHabito]);
    const res = await controller.listarHabitos('Diaria', 'dep-1');
    expect(service.listar).toHaveBeenCalledWith('Diaria', 'dep-1');
    expect(res).toEqual([mockHabito]);
  });

  it('debe buscar avanzado', async () => {
    service.buscarAvanzado.mockResolvedValue([mockHabito]);
    const dto = { nombre: 'Correr', frecuencia: 'Diaria', deportistaId: 'dep-1' };
    const res = await controller.buscarAvanzado(dto);
    expect(service.buscarAvanzado).toHaveBeenCalledWith(dto);
    expect(res).toEqual([mockHabito]);
  });

  it('debe buscar por id', async () => {
    service.buscarPorId.mockResolvedValue(mockHabito);
    const res = await controller.buscarPorId('hab-1');
    expect(service.buscarPorId).toHaveBeenCalledWith('hab-1');
    expect(res).toEqual(mockHabito);
  });

  it('debe reemplazar hábito', async () => {
    service.reemplazar.mockResolvedValue(mockHabito);
    const dto = {
      nombre: 'Correr',
      descripcion: 'Cambiado',
      frecuencia: 'Semanal',
      deportistaId: 'dep-1',
      rachaActual: 0,
      rachaMaxima: 0,
    };
    const res = await controller.reemplazar('hab-1', dto);
    expect(service.reemplazar).toHaveBeenCalledWith('hab-1', dto);
    expect(res).toEqual(mockHabito);
  });

  it('debe actualizar frecuencia', async () => {
    service.actualizarFrecuencia.mockResolvedValue(mockHabito);
    const dto = { frecuencia: 'Semanal' };
    const res = await controller.actualizarFrecuencia('hab-1', dto);
    expect(service.actualizarFrecuencia).toHaveBeenCalledWith('hab-1', dto);
    expect(res).toEqual(mockHabito);
  });

  it('debe eliminar hábito', async () => {
    service.eliminar.mockResolvedValue(undefined);
    await controller.eliminar('hab-1');
    expect(service.eliminar).toHaveBeenCalledWith('hab-1');
  });
});

