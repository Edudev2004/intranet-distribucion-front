import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ZonasService } from './zonas.service';
import { ZonaRequestDTO, ZonaResponseDTO } from './zona.model';
import { environment } from '../../../environments/environment';

describe('ZonasService', () => {
  let service: ZonasService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/zonas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ZonasService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ZonasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list all zonas', () => {
    const mockZonas: ZonaResponseDTO[] = [
      { idZona: 1, nombre: 'Lima Norte', descripcion: 'Comas, Independencia, Los Olivos' },
      { idZona: 2, nombre: 'Lima Sur', descripcion: 'Chorrillos, SJM, VMT' }
    ];

    service.listar().subscribe((zonas) => {
      expect(zonas.length).toBe(2);
      expect(zonas[0].nombre).toBe('Lima Norte');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockZonas);
  });

  it('should get a single zona by id', () => {
    const mockZona: ZonaResponseDTO = {
      idZona: 1,
      nombre: 'Lima Norte',
      descripcion: 'Comas, Independencia, Los Olivos'
    };

    service.obtenerPorId(1).subscribe((zona) => {
      expect(zona.idZona).toBe(1);
      expect(zona.nombre).toBe('Lima Norte');
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockZona);
  });

  it('should create a new zona', () => {
    const request: ZonaRequestDTO = {
      nombre: 'Callao & Ventanilla',
      descripcion: 'Callao, Bellavista, La Perla, Ventanilla'
    };

    const mockResponse: ZonaResponseDTO = {
      idZona: 3,
      nombre: request.nombre,
      descripcion: request.descripcion
    };

    service.crear(request).subscribe((created) => {
      expect(created.idZona).toBe(3);
      expect(created.nombre).toBe('Callao & Ventanilla');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should update an existing zona', () => {
    const request: ZonaRequestDTO = {
      nombre: 'Lima Centro Modificada',
      descripcion: 'Cercado de Lima y Breña'
    };

    const mockResponse: ZonaResponseDTO = {
      idZona: 1,
      nombre: request.nombre,
      descripcion: request.descripcion
    };

    service.actualizar(1, request).subscribe((updated) => {
      expect(updated.nombre).toBe('Lima Centro Modificada');
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should delete a zona by id', () => {
    service.eliminar(1).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
