import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportesService } from './reportes.service';
import { environment } from '../../../environments/environment';
import { ReportePedido } from './reporte-pedido.model';
import { ReporteEntrega } from './reporte-entrega.model';
import { ReporteProductividadFlota } from './reporte-flota.model';

describe('ReportesService', () => {
  let service: ReportesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportesService],
    });
    service = TestBed.inject(ReportesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe obtener reporte de pedidos con filtros correctamente (RF-23)', () => {
    const mockReporte: ReportePedido = {
      generadoEn: '2026-11-19T21:00:00Z',
      totalPedidos: 2,
      montoTotalGeneral: 1500.5,
      items: [
        {
          idPedido: 101,
          cliente: 'Distribuidora ABC',
          almacen: 'Almacén Central',
          idEstadoPedido: 2,
          estado: 'APROBADO',
          fechaPedido: '2026-11-18',
          total: 800.5,
        },
      ],
    };

    service
      .pedidos({ fechaInicio: '2026-11-01', fechaFin: '2026-11-19', idEstado: 2, idCliente: 15 })
      .subscribe(res => {
        expect(res.totalPedidos).toBe(2);
        expect(res.montoTotalGeneral).toBe(1500.5);
      });

    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/reportes/pedidos` &&
        r.params.get('fechaInicio') === '2026-11-01' &&
        r.params.get('fechaFin') === '2026-11-19' &&
        r.params.get('idEstado') === '2' &&
        r.params.get('idCliente') === '15'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockReporte);
  });

  it('debe solicitar descarga de reporte de pedidos en PDF como Blob (RF-23)', () => {
    const mockBlob = new Blob(['%PDF-1.4 mock pdf content'], { type: 'application/pdf' });

    service.descargarPedidos('pdf', { fechaInicio: '2026-11-01' }).subscribe(blob => {
      expect(blob).toBeTruthy();
    });

    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/reportes/pedidos/pdf` &&
        r.params.get('fechaInicio') === '2026-11-01'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);
  });

  it('debe obtener reporte de entregas y cumplimiento (RF-24)', () => {
    const mockReporte: ReporteEntrega = {
      generadoEn: '2026-11-19T21:00:00Z',
      totalEntregas: 10,
      totalATiempo: 8,
      totalConRetraso: 1,
      totalPendientes: 1,
      porcentajeCumplimiento: 80.0,
      items: [],
    };

    service
      .entregas({ fechaInicio: '2026-11-01', fechaFin: '2026-11-19', idEstado: 3 })
      .subscribe(res => {
        expect(res.totalEntregas).toBe(10);
        expect(res.porcentajeCumplimiento).toBe(80.0);
      });

    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/reportes/entregas` &&
        r.params.get('fechaInicio') === '2026-11-01' &&
        r.params.get('idEstado') === '3'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockReporte);
  });

  it('debe obtener reporte de productividad de flota con filtros (RF-25)', () => {
    const mockFlota: ReporteProductividadFlota = {
      totalRutasProgramadas: 15,
      totalRutasCompletadas: 14,
      tasaCumplimientoGeneralPct: 93.3,
      tiempoPromedioGeneralMinutos: 110.5,
      tiempoPromedioGeneralFormateado: '1h 50m',
      vehiculoMasProductivo: 'ABC-123',
      conductorMasProductivo: 'Juan Pérez',
      metricasVehiculos: [
        {
          idVehiculo: 1,
          placa: 'ABC-123',
          marca: 'Toyota',
          modelo: 'Hilux',
          capacidadKg: 1000,
          rutasAsignadas: 8,
          rutasCompletadas: 8,
          tiempoTotalMinutos: 800,
          tiempoPromedioMinutos: 100,
          tiempoPromedioFormateado: '1h 40m',
          tasaCumplimientoPct: 100,
        },
      ],
      metricasConductores: [
        {
          idConductor: 1,
          nombres: 'Juan',
          apellidos: 'Pérez',
          nombreCompleto: 'Juan Pérez',
          dni: '12345678',
          nroLicencia: 'Q12345678',
          rutasAsignadas: 8,
          rutasCompletadas: 8,
          tiempoTotalMinutos: 800,
          tiempoPromedioMinutos: 100,
          tiempoPromedioFormateado: '1h 40m',
          tasaCumplimientoPct: 100,
        },
      ],
      detallesRutas: [],
    };

    service
      .productividadFlota({ fechaInicio: '2026-11-01', idVehiculo: 1, idConductor: 1 })
      .subscribe(res => {
        expect(res.totalRutasProgramadas).toBe(15);
        expect(res.tasaCumplimientoGeneralPct).toBe(93.3);
        expect(res.metricasVehiculos.length).toBe(1);
        expect(res.metricasConductores[0].nombreCompleto).toBe('Juan Pérez');
      });

    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/reportes/flota` &&
        r.params.get('fechaInicio') === '2026-11-01' &&
        r.params.get('idVehiculo') === '1' &&
        r.params.get('idConductor') === '1'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockFlota);
  });

  it('debe solicitar descarga de reporte de productividad en PDF y Excel como Blob (RF-25)', () => {
    const mockBlobPdf = new Blob(['%PDF-1.4 mock flota'], { type: 'application/pdf' });
    const mockBlobExcel = new Blob(['mock excel flota'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    service.descargarProductividadFlota('pdf', {}).subscribe(blob => {
      expect(blob).toBeTruthy();
    });
    const reqPdf = httpMock.expectOne(`${environment.apiUrl}/reportes/flota/pdf`);
    expect(reqPdf.request.method).toBe('GET');
    reqPdf.flush(mockBlobPdf);

    service.descargarProductividadFlota('excel', {}).subscribe(blob => {
      expect(blob).toBeTruthy();
    });
    const reqExcel = httpMock.expectOne(`${environment.apiUrl}/reportes/flota/excel`);
    expect(reqExcel.request.method).toBe('GET');
    reqExcel.flush(mockBlobExcel);
  });
});
