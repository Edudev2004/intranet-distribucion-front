import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InventoryService } from './inventory.service';
import { environment } from '../../../../environments/environment';
import { InventarioConsulta, MovimientoRequest, MovimientoResponse, AjusteStockRequest } from '../models/inventory.model';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/inventario`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InventoryService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should query inventario with params', () => {
    const mockData: InventarioConsulta = {
      items: [
        {
          idAlmacen: 1,
          almacen: 'Almacén Central',
          sede: 'Sede Callao',
          idProducto: 1,
          codigo: 'PROD-001',
          producto: 'Cerveza Pilsen Callao 330ml',
          categoria: 'Cervezas y Licores',
          unidad: 'CAJ',
          stockActual: 450,
          stockMinimo: 50,
          precioUnitario: 68.0,
          bajoStock: false,
          nivelAlerta: 'NORMAL'
        }
      ],
      totalProductos: 1,
      totalBajoStock: 0,
      totalSinStock: 0
    };

    service.consultarInventario({ idAlmacen: 1, soloBajoStock: false }).subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.totalProductos).toBe(1);
      expect(res.items[0].codigo).toBe('PROD-001');
    });

    const req = httpMock.expectOne(`${baseUrl}?idAlmacen=1&soloBajoStock=false`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should register movement', () => {
    const payload: MovimientoRequest = {
      idAlmacen: 1,
      idTipoMovimiento: 1,
      items: [{ idProducto: 1, cantidad: 50 }]
    };

    const mockResponse: MovimientoResponse = {
      idMovimiento: 10,
      idAlmacen: 1,
      almacen: 'Almacén Central',
      idTipoMovimiento: 1,
      tipoMovimiento: 'ENTRADA_COMPRA',
      naturaleza: 'E',
      idUsuario: 1,
      usuario: 'admin@distribucion.com',
      fecha: '2026-11-19T12:00:00Z',
      items: [
        {
          idProducto: 1,
          codigo: 'PROD-001',
          producto: 'Pilsen',
          cantidad: 50,
          stockResultante: 500,
          alertaStock: false
        }
      ],
      contieneAlertas: false
    };

    service.registrarMovimiento(payload).subscribe((res) => {
      expect(res.idMovimiento).toBe(10);
      expect(res.naturaleza).toBe('E');
      expect(res.items[0].stockResultante).toBe(500);
    });

    const req = httpMock.expectOne(`${baseUrl}/movimientos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should execute stock adjustment', () => {
    const payload: AjusteStockRequest = {
      idAlmacen: 1,
      idProducto: 1,
      nuevoStock: 480,
      motivo: 'Inventario físico'
    };

    const mockResponse: MovimientoResponse = {
      idMovimiento: 11,
      idAlmacen: 1,
      almacen: 'Almacén Central',
      idTipoMovimiento: 2,
      tipoMovimiento: 'ENTRADA_AJUSTE',
      naturaleza: 'E',
      idUsuario: 1,
      usuario: 'admin@distribucion.com',
      fecha: '2026-11-19T12:05:00Z',
      items: [],
      contieneAlertas: false
    };

    service.ajustarStock(payload).subscribe((res) => {
      expect(res.idMovimiento).toBe(11);
    });

    const req = httpMock.expectOne(`${baseUrl}/ajuste`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });
});
