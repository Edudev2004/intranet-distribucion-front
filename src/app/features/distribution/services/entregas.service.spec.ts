import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EntregasService } from './entregas.service';
import { ActualizarEntregaRequest, Entrega } from '../models/entrega.model';
import { environment } from '../../../../environments/environment';

describe('EntregasService', () => {
  let service: EntregasService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/entregas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EntregasService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(EntregasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list entregas by idProgramacion', () => {
    const mockEntregas: Entrega[] = [
      {
        idEntrega: 1,
        idProgramacion: 10,
        idPedido: 101,
        idEstadoEntrega: 1,
        estadoEntrega: 'Pendiente',
        ordenVisita: 1,
        cliente: 'Comercializadora Lima SAC'
      }
    ];

    service.listarPorProgramacion(10).subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].idEntrega).toBe(1);
      expect(res[0].cliente).toBe('Comercializadora Lima SAC');
    });

    const req = httpMock.expectOne(`${baseUrl}/programacion/10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEntregas);
  });

  it('should update delivery status and POD evidence', () => {
    const payload: ActualizarEntregaRequest = {
      idEstadoEntrega: 3,
      fotoEntregaUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48',
      fotoGuiaUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
      notas: 'Entrega conforme en recepción'
    };

    const mockResponse: Entrega = {
      idEntrega: 1,
      idProgramacion: 10,
      idPedido: 101,
      idEstadoEntrega: 3,
      estadoEntrega: 'Entregado',
      fotoEntregaUrl: payload.fotoEntregaUrl,
      fotoGuiaUrl: payload.fotoGuiaUrl,
      notas: payload.notas
    };

    service.actualizarEstado(1, payload).subscribe((res) => {
      expect(res.idEstadoEntrega).toBe(3);
      expect(res.fotoEntregaUrl).toBe(payload.fotoEntregaUrl);
      expect(res.notas).toBe(payload.notas);
    });

    const req = httpMock.expectOne(`${baseUrl}/1/estado`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });
});
