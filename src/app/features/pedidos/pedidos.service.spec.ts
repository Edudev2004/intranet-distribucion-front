import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PedidosService } from './pedidos.service';
import { environment } from '../../../environments/environment';
import { AprobacionPedidoRequest, AprobacionPedidoResponse, PedidoResumen } from './pedido.model';

describe('PedidosService', () => {
  let service: PedidosService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/pedidos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PedidosService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PedidosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list pedidos with status filter', () => {
    const mockList: PedidoResumen[] = [
      {
        idPedido: 1,
        cliente: 'Distribuidora Norte',
        almacen: 'Almacén Central',
        idEstadoPedido: 1,
        estado: 'Pendiente',
        fechaPedido: '19/11/2026',
        total: 1500.5
      }
    ];

    service.listar(1).subscribe(res => {
      expect(res.length).toBe(1);
      expect(res[0].idPedido).toBe(1);
      expect(res[0].estado).toBe('Pendiente');
    });

    const req = httpMock.expectOne(`${baseUrl}?idEstado=1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockList);
  });

  it('should approve a pedido via POST to /{id}/aprobacion (RF-11)', () => {
    const reqBody: AprobacionPedidoRequest = {
      decision: 'APROBADO',
      motivo: 'Aprobación autorizada por supervisor'
    };

    const mockResponse: AprobacionPedidoResponse = {
      idAprobacion: 1,
      idPedido: 1,
      decision: 'APROBADO',
      motivo: reqBody.motivo || null,
      usuarioAprobador: 'Carlos Supervisor',
      fecha: '2026-11-19T14:00:00Z'
    };

    service.aprobarRechazar(1, reqBody).subscribe(res => {
      expect(res.decision).toBe('APROBADO');
      expect(res.usuarioAprobador).toBe('Carlos Supervisor');
    });

    const req = httpMock.expectOne(`${baseUrl}/1/aprobacion`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(reqBody);
    req.flush(mockResponse);
  });

  it('should reject a pedido with motive via POST to /{id}/aprobacion (RF-11)', () => {
    const reqBody: AprobacionPedidoRequest = {
      decision: 'RECHAZADO',
      motivo: 'Límite de crédito excedido'
    };

    const mockResponse: AprobacionPedidoResponse = {
      idAprobacion: 2,
      idPedido: 2,
      decision: 'RECHAZADO',
      motivo: 'Límite de crédito excedido',
      usuarioAprobador: 'Carlos Supervisor',
      fecha: '2026-11-19T14:05:00Z'
    };

    service.aprobarRechazar(2, reqBody).subscribe(res => {
      expect(res.decision).toBe('RECHAZADO');
      expect(res.motivo).toBe('Límite de crédito excedido');
    });

    const req = httpMock.expectOne(`${baseUrl}/2/aprobacion`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(reqBody);
    req.flush(mockResponse);
  });
});
