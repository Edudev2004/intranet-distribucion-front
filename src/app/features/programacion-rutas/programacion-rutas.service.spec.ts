import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProgramacionRutasService } from './programacion-rutas.service';
import { environment } from '../../../environments/environment';
import {
  AsignacionPedidosResponse,
  PedidoDisponibleAsignacion,
  ProgramacionRuta,
  ResumenCargaRuta,
} from './programacion-ruta.model';

describe('ProgramacionRutasService', () => {
  let service: ProgramacionRutasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProgramacionRutasService],
    });
    service = TestBed.inject(ProgramacionRutasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe listar todas las programaciones de rutas', () => {
    const mockList: ProgramacionRuta[] = [
      {
        idProgramacion: 1,
        idRuta: 2,
        nombreRuta: 'Ruta Cono Norte',
        nombreZona: 'Lima Norte',
        idVehiculo: 1,
        placaVehiculo: 'ABC-123',
        modeloVehiculo: 'Toyota Hilux',
        capacidadVehiculoKg: 1000,
        idConductor: 1,
        nombreConductor: 'Carlos Pérez',
        inicioProgramado: '2026-11-20T08:00:00Z',
        idEstadoProgramacion: 1,
        estadoProgramacion: 'Programada',
        pesoOcupadoKg: 250,
        porcentajeOcupacion: 25,
        totalPedidos: 3,
      },
    ];

    service.listarTodas().subscribe(res => {
      expect(res.length).toBe(1);
      expect(res[0].nombreRuta).toBe('Ruta Cono Norte');
      expect(res[0].placaVehiculo).toBe('ABC-123');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/programacion-rutas`);
    expect(req.request.method).toBe('GET');
    req.flush(mockList);
  });

  it('debe listar pedidos disponibles para asignación (RF-15)', () => {
    const mockPedidos: PedidoDisponibleAsignacion[] = [
      {
        idPedido: 101,
        idCliente: 5,
        cliente: 'Bodega Santa Rosa',
        numeroDocumentoCliente: '20123456789',
        direccionEntrega: 'Av. Túpac Amaru 450',
        zonaCliente: 'Lima Norte',
        idEstadoPedido: 2,
        estado: 'APROBADO',
        fechaPedido: '2026-11-19',
        pesoTotalKg: 120.5,
        importeTotal: 450.0,
      },
    ];

    service.listarPedidosDisponibles(undefined, 2).subscribe(res => {
      expect(res.length).toBe(1);
      expect(res[0].cliente).toBe('Bodega Santa Rosa');
      expect(res[0].pesoTotalKg).toBe(120.5);
    });

    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/programacion-rutas/pedidos-disponibles` &&
        r.params.get('idZona') === '2'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPedidos);
  });

  it('debe obtener resumen de carga de la ruta (RF-15)', () => {
    const mockResumen: ResumenCargaRuta = {
      idProgramacion: 1,
      idVehiculo: 1,
      placaVehiculo: 'ABC-123',
      modeloVehiculo: 'Toyota Hilux',
      capacidadMaximaKg: 1000,
      pesoOcupadoKg: 400,
      pesoDisponibleKg: 600,
      porcentajeOcupacion: 40,
      totalPedidos: 2,
    };

    service.obtenerResumenCarga(1).subscribe(res => {
      expect(res.capacidadMaximaKg).toBe(1000);
      expect(res.pesoOcupadoKg).toBe(400);
      expect(res.porcentajeOcupacion).toBe(40);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/programacion-rutas/1/resumen-carga`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResumen);
  });

  it('debe asignar pedidos seleccionados a una ruta (RF-15)', () => {
    const mockResponse: AsignacionPedidosResponse = {
      idProgramacion: 1,
      idVehiculo: 1,
      vehiculoPlaca: 'ABC-123',
      capacidadVehiculoKg: 1000,
      pesoTotalAsignadoKg: 350,
      pesoDisponibleKg: 650,
      porcentajeOcupacion: 35,
      cantidadPedidosAsignados: 2,
      mensaje: 'Pedidos asignados exitosamente',
    };

    service.asignarPedidos(1, { idPedidos: [101, 102] }).subscribe(res => {
      expect(res.cantidadPedidosAsignados).toBe(2);
      expect(res.pesoTotalAsignadoKg).toBe(350);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/programacion-rutas/1/asignar-pedidos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idPedidos: [101, 102] });
    req.flush(mockResponse);
  });

  it('debe auto-asignar pedidos de forma inteligente a una ruta (RF-15)', () => {
    const mockResponse: AsignacionPedidosResponse = {
      idProgramacion: 1,
      idVehiculo: 1,
      vehiculoPlaca: 'ABC-123',
      capacidadVehiculoKg: 1000,
      pesoTotalAsignadoKg: 780,
      pesoDisponibleKg: 220,
      porcentajeOcupacion: 78,
      cantidadPedidosAsignados: 4,
      mensaje: 'Se auto-asignaron 4 pedidos a la ruta',
    };

    service.autoAsignarPedidos(1).subscribe(res => {
      expect(res.cantidadPedidosAsignados).toBe(4);
      expect(res.porcentajeOcupacion).toBe(78);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/programacion-rutas/1/auto-asignar-pedidos`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
