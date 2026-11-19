import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { DashboardKpiResponseDTO, RutaActivaDTO } from './dashboard.model';
import { environment } from '../../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch dashboard kpis from API', () => {
    const mockKpis: DashboardKpiResponseDTO = {
      totalPedidos: 120,
      pedidosAprobados: 95,
      pedidosPendientes: 15,
      totalEntregasExitosas: 80,
      totalEntregasConIncidencia: 5,
      vehiculosEnRuta: 8,
      conductoresActivos: 10
    };

    service.obtenerKpis().subscribe((kpis) => {
      expect(kpis.totalPedidos).toBe(120);
      expect(kpis.pedidosAprobados).toBe(95);
      expect(kpis.pedidosPendientes).toBe(15);
      expect(kpis.totalEntregasExitosas).toBe(80);
      expect(kpis.totalEntregasConIncidencia).toBe(5);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/kpis`);
    expect(req.request.method).toBe('GET');
    req.flush(mockKpis);
  });

  it('should fetch active route schedules from API', () => {
    const mockRutas: RutaActivaDTO[] = [
      {
        idProgramacion: 1,
        idRuta: 2,
        idVehiculo: 3,
        idConductor: 4,
        inicioProgramado: '2026-11-19T08:00:00Z',
        finProgramado: '2026-11-19T17:00:00Z',
        idEstadoProgramacion: 1,
        estadoProgramacion: 'Registrado'
      }
    ];

    service.obtenerRutasActivas().subscribe((rutas) => {
      expect(rutas.length).toBe(1);
      expect(rutas[0].idProgramacion).toBe(1);
      expect(rutas[0].estadoProgramacion).toBe('Registrado');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/programacion-rutas`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRutas);
  });
});
