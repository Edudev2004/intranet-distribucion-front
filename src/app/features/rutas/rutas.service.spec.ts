import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RutasService } from './rutas.service';
import { RutaRequestDTO, RutaResponseDTO } from './ruta.model';
import { environment } from '../../../environments/environment';

describe('RutasService', () => {
  let service: RutasService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/rutas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RutasService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(RutasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list all rutas with query parameters', () => {
    const mockRutas: RutaResponseDTO[] = [
      {
        idRuta: 1,
        nombre: 'Ruta Norte 01',
        idZona: 2,
        nombreZona: 'Lima Norte',
        activo: true
      }
    ];

    service.listar(2, true).subscribe((rutas) => {
      expect(rutas.length).toBe(1);
      expect(rutas[0].nombre).toBe('Ruta Norte 01');
      expect(rutas[0].nombreZona).toBe('Lima Norte');
    });

    const req = httpMock.expectOne(`${baseUrl}?idZona=2&activos=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRutas);
  });

  it('should get a single ruta by id', () => {
    const mockRuta: RutaResponseDTO = {
      idRuta: 1,
      nombre: 'Ruta Norte 01',
      idZona: 2,
      nombreZona: 'Lima Norte',
      activo: true
    };

    service.obtenerPorId(1).subscribe((ruta) => {
      expect(ruta.idRuta).toBe(1);
      expect(ruta.nombre).toBe('Ruta Norte 01');
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRuta);
  });

  it('should create a new ruta', () => {
    const request: RutaRequestDTO = {
      nombre: 'Ruta Sur Express',
      idZona: 3,
      activo: true
    };

    const mockResponse: RutaResponseDTO = {
      idRuta: 5,
      nombre: request.nombre,
      idZona: request.idZona,
      nombreZona: 'Lima Sur',
      activo: true
    };

    service.crear(request).subscribe((created) => {
      expect(created.idRuta).toBe(5);
      expect(created.nombre).toBe('Ruta Sur Express');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should update an existing ruta', () => {
    const request: RutaRequestDTO = {
      nombre: 'Ruta Sur Express Modificada',
      idZona: 3,
      activo: true
    };

    const mockResponse: RutaResponseDTO = {
      idRuta: 5,
      nombre: request.nombre,
      idZona: request.idZona,
      nombreZona: 'Lima Sur',
      activo: true
    };

    service.actualizar(5, request).subscribe((updated) => {
      expect(updated.nombre).toBe('Ruta Sur Express Modificada');
    });

    const req = httpMock.expectOne(`${baseUrl}/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should change ruta active status via PATCH', () => {
    service.cambiarEstado(1, false).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/1/estado?activo=false`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });
});
