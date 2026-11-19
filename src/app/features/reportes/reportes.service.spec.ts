import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportesService } from './reportes.service';
import { environment } from '../../../environments/environment';
import { ReportePedido } from './reporte-pedido.model';
import { ReporteEntrega } from './reporte-entrega.model';

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

  it('debe obtener reporte de pedidos con filtros correctamente', () => {
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
        {
          idPedido: 102,
          cliente: 'Comercial XYZ',
          almacen: 'Almacén Norte',
          idEstadoPedido: 1,
          estado: 'PENDIENTE',
          fechaPedido: '2026-11-19',
          total: 700.0,
        },
      ],
    };

    service
      .pedidos({ fechaInicio: '2026-11-01', fechaFin: '2026-11-19', idEstado: 2, idCliente: 15 })
      .subscribe(res => {
        expect(res.totalPedidos).toBe(2);
        expect(res.montoTotalGeneral).toBe(1500.5);
        expect(res.items.length).toBe(2);
        expect(res.items[0].cliente).toBe('Distribuidora ABC');
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

  it('debe solicitar descarga de reporte de pedidos en PDF como Blob', () => {
    const mockBlob = new Blob(['%PDF-1.4 mock pdf content'], { type: 'application/pdf' });

    service.descargarPedidos('pdf', { fechaInicio: '2026-11-01' }).subscribe(blob => {
      expect(blob).toBeTruthy();
      expect(blob.type).toBe('application/pdf');
    });

    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/reportes/pedidos/pdf` &&
        r.params.get('fechaInicio') === '2026-11-01'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(mockBlob);
  });

  it('debe solicitar descarga de reporte de pedidos en Excel como Blob', () => {
    const mockBlob = new Blob(['mock xlsx content'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    service.descargarPedidos('excel', {}).subscribe(blob => {
      expect(blob).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reportes/pedidos/excel`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(mockBlob);
  });

  it('debe obtener reporte de entregas y cumplimiento con métricas calculadas', () => {
    const mockReporte: ReporteEntrega = {
      generadoEn: '2026-11-19T21:00:00Z',
      totalEntregas: 10,
      totalATiempo: 8,
      totalConRetraso: 1,
      totalPendientes: 1,
      porcentajeCumplimiento: 80.0,
      items: [
        {
          idEntrega: 1,
          idPedido: 101,
          cliente: 'Cadena Farma Norte',
          direccion: 'Av. Los Próceres 123',
          estadoEntrega: 'ENTREGADO',
          horaEstimada: '10:00',
          horaEntregaReal: '09:45',
          cumplimiento: 'A TIEMPO',
          notas: 'Recibido conforme por almacenero',
        },
      ],
    };

    service
      .entregas({ fechaInicio: '2026-11-01', fechaFin: '2026-11-19', idEstado: 3 })
      .subscribe(res => {
        expect(res.totalEntregas).toBe(10);
        expect(res.totalATiempo).toBe(8);
        expect(res.porcentajeCumplimiento).toBe(80.0);
        expect(res.items.length).toBe(1);
        expect(res.items[0].cumplimiento).toBe('A TIEMPO');
      });

    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/reportes/entregas` &&
        r.params.get('fechaInicio') === '2026-11-01' &&
        r.params.get('fechaFin') === '2026-11-19' &&
        r.params.get('idEstado') === '3'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockReporte);
  });

  it('debe solicitar descarga de reporte de entregas en PDF y Excel como Blob', () => {
    const mockBlobPdf = new Blob(['%PDF-1.4 mock entregas'], { type: 'application/pdf' });
    const mockBlobExcel = new Blob(['mock excel entregas'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    service.descargarEntregas('pdf', {}).subscribe(blob => {
      expect(blob).toBeTruthy();
    });
    const reqPdf = httpMock.expectOne(`${environment.apiUrl}/reportes/entregas/pdf`);
    expect(reqPdf.request.method).toBe('GET');
    reqPdf.flush(mockBlobPdf);

    service.descargarEntregas('excel', {}).subscribe(blob => {
      expect(blob).toBeTruthy();
    });
    const reqExcel = httpMock.expectOne(`${environment.apiUrl}/reportes/entregas/excel`);
    expect(reqExcel.request.method).toBe('GET');
    reqExcel.flush(mockBlobExcel);
  });
});
