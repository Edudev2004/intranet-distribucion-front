import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SedesService } from './sedes.service';
import { Sede, SedeRequest } from './sede.model';
import { environment } from '../../../environments/environment';

describe('SedesService', () => {
  let service: SedesService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/sedes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SedesService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(SedesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all sedes with soloActivos parameter', () => {
    const mockSedes: Sede[] = [
      {
        idSede: 1,
        nombre: 'Sede Central Callao',
        direccion: 'Av. Argentina 1240',
        idResponsable: 1,
        nombreResponsable: 'Juan Perez',
        correoResponsable: 'juan@correo.com',
        activo: true,
        totalAlmacenes: 3,
        totalUsuarios: 12
      }
    ];

    service.listar(true).subscribe((sedes) => {
      expect(sedes.length).toBe(1);
      expect(sedes[0].nombre).toBe('Sede Central Callao');
      expect(sedes[0].totalAlmacenes).toBe(3);
    });

    const req = httpMock.expectOne(`${baseUrl}?soloActivos=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSedes);
  });

  it('should create a new sede', () => {
    const nuevaSede: SedeRequest = {
      nombre: 'Hub Sur Lurín',
      direccion: 'Km 35 Panamericana Sur',
      idResponsable: 2,
      activo: true
    };

    const mockResponse: Sede = {
      idSede: 2,
      ...nuevaSede,
      nombreResponsable: 'Carlos López',
      correoResponsable: 'carlos@correo.com',
      activo: true,
      totalAlmacenes: 0,
      totalUsuarios: 0
    };

    service.crear(nuevaSede).subscribe((sede) => {
      expect(sede.idSede).toBe(2);
      expect(sede.nombre).toBe('Hub Sur Lurín');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevaSede);
    req.flush(mockResponse);
  });

  it('should toggle sede active status via PATCH', () => {
    const mockResponse: Sede = {
      idSede: 1,
      nombre: 'Sede Central Callao',
      direccion: 'Av. Argentina 1240',
      idResponsable: 1,
      nombreResponsable: 'Juan Perez',
      correoResponsable: 'juan@correo.com',
      activo: false,
      totalAlmacenes: 3,
      totalUsuarios: 12
    };

    service.cambiarEstado(1, false).subscribe((res) => {
      expect(res.activo).toBe(false);
    });

    const req = httpMock.expectOne(`${baseUrl}/1/estado?activo=false`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockResponse);
  });
});
