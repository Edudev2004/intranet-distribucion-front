import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClientesService } from './clientes.service';
import {
  ClienteOpcionDTO,
  ClienteRequestDTO,
  ClienteResponseDTO,
  TipoDocumentoDTO
} from './cliente.model';
import { environment } from '../../../environments/environment';

describe('ClientesService', () => {
  let service: ClientesService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/clientes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClientesService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ClientesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list clients with filters', () => {
    const mockClientes: ClienteResponseDTO[] = [
      {
        idCliente: 1,
        idTipoDocumento: 2,
        tipoDocumentoNombre: 'RUC',
        numeroDocumento: '20100123456',
        nombreRazonSocial: 'Distribuidora del Norte S.A.C.',
        direccion: 'Av. Industrial 450, Lima',
        telefono: '998877665',
        correo: 'contacto@distribuidoranorte.pe',
        activo: true
      }
    ];

    service.listar('Norte', true).subscribe((clientes) => {
      expect(clientes.length).toBe(1);
      expect(clientes[0].nombreRazonSocial).toBe('Distribuidora del Norte S.A.C.');
      expect(clientes[0].numeroDocumento).toBe('20100123456');
    });

    const req = httpMock.expectOne(`${baseUrl}?filtro=Norte&soloActivos=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockClientes);
  });

  it('should get a single client by id', () => {
    const mockCliente: ClienteResponseDTO = {
      idCliente: 1,
      idTipoDocumento: 1,
      tipoDocumentoNombre: 'DNI',
      numeroDocumento: '72123456',
      nombreRazonSocial: 'Juan Manuel Perez',
      direccion: 'Jr. Los Cedros 123',
      telefono: '912345678',
      correo: 'juan.perez@example.com',
      activo: true
    };

    service.obtenerPorId(1).subscribe((cliente) => {
      expect(cliente.idCliente).toBe(1);
      expect(cliente.nombreRazonSocial).toBe('Juan Manuel Perez');
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCliente);
  });

  it('should create a client', () => {
    const request: ClienteRequestDTO = {
      idTipoDocumento: 2,
      numeroDocumento: '20556677889',
      nombreRazonSocial: 'Corporación Logística Lima',
      direccion: 'Av. Elmer Faucett 200',
      telefono: '944332211',
      correo: 'ventas@logisticalima.pe',
      activo: true
    };

    const mockResponse: ClienteResponseDTO = {
      idCliente: 2,
      ...request,
      tipoDocumentoNombre: 'RUC',
      activo: true
    };

    service.crear(request).subscribe((created) => {
      expect(created.idCliente).toBe(2);
      expect(created.numeroDocumento).toBe('20556677889');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should update an existing client', () => {
    const request: ClienteRequestDTO = {
      idTipoDocumento: 2,
      numeroDocumento: '20556677889',
      nombreRazonSocial: 'Corporación Logística Lima Modificada',
      direccion: 'Av. Elmer Faucett 200 Oficina 401',
      telefono: '944332299',
      correo: 'contacto@logisticalima.pe',
      activo: true
    };

    const mockResponse: ClienteResponseDTO = {
      idCliente: 2,
      ...request,
      tipoDocumentoNombre: 'RUC',
      activo: true
    };

    service.actualizar(2, request).subscribe((updated) => {
      expect(updated.nombreRazonSocial).toBe('Corporación Logística Lima Modificada');
    });

    const req = httpMock.expectOne(`${baseUrl}/2`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should change client active status via PATCH', () => {
    service.cambiarEstado(1, false).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/1/estado?activo=false`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('should delete a client via DELETE', () => {
    service.eliminar(1).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should fetch document types', () => {
    const mockTipos: TipoDocumentoDTO[] = [
      { idTipoDocumento: 1, nombre: 'DNI' },
      { idTipoDocumento: 2, nombre: 'RUC' }
    ];

    service.listarTiposDocumento().subscribe((tipos) => {
      expect(tipos.length).toBe(2);
      expect(tipos[0].nombre).toBe('DNI');
    });

    const req = httpMock.expectOne(`${baseUrl}/tipos-documento`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTipos);
  });

  it('should fetch client options', () => {
    const mockOpciones: ClienteOpcionDTO[] = [
      {
        idCliente: 1,
        nombreRazonSocial: 'Distribuidora del Norte',
        numeroDocumento: '20100123456',
        tipoDocumento: 'RUC'
      }
    ];

    service.listarOpciones().subscribe((opciones) => {
      expect(opciones.length).toBe(1);
      expect(opciones[0].nombreRazonSocial).toBe('Distribuidora del Norte');
    });

    const req = httpMock.expectOne(`${baseUrl}/opciones`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOpciones);
  });
});
