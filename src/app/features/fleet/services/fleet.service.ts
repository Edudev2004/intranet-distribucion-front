import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Vehiculo,
  VehiculoRequest,
  EstadoVehiculo,
  Conductor,
  ConductorRequest,
} from '../models/fleet.model';

@Injectable({ providedIn: 'root' })
export class FleetService {
  private http = inject(HttpClient);
  private vehiculosBase = `${environment.apiUrl}/vehiculos`;
  private conductoresBase = `${environment.apiUrl}/conductores`;

  // === VEHÍCULOS (RF-18) ===
  listarVehiculos(idEstado?: number | null): Observable<Vehiculo[]> {
    let params = new HttpParams();
    if (idEstado != null) {
      params = params.set('idEstado', idEstado);
    }
    return this.http.get<Vehiculo[]>(this.vehiculosBase, { params });
  }

  listarEstadosVehiculo(): Observable<EstadoVehiculo[]> {
    return this.http.get<EstadoVehiculo[]>(`${this.vehiculosBase}/estados`);
  }

  obtenerVehiculoPorId(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.vehiculosBase}/${id}`);
  }

  crearVehiculo(body: VehiculoRequest): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(this.vehiculosBase, body);
  }

  actualizarVehiculo(id: number, body: VehiculoRequest): Observable<Vehiculo> {
    return this.http.put<Vehiculo>(`${this.vehiculosBase}/${id}`, body);
  }

  cambiarEstadoVehiculo(id: number, idEstado: number): Observable<void> {
    const params = new HttpParams().set('idEstado', idEstado);
    return this.http.patch<void>(`${this.vehiculosBase}/${id}/estado`, null, { params });
  }

  eliminarVehiculo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.vehiculosBase}/${id}`);
  }

  // === CONDUCTORES (RF-19) ===
  listarConductores(soloActivos?: boolean | null): Observable<Conductor[]> {
    let params = new HttpParams();
    if (soloActivos != null) {
      params = params.set('activos', soloActivos);
    }
    return this.http.get<Conductor[]>(this.conductoresBase, { params });
  }

  obtenerConductorPorId(id: number): Observable<Conductor> {
    return this.http.get<Conductor>(`${this.conductoresBase}/${id}`);
  }

  crearConductor(body: ConductorRequest): Observable<Conductor> {
    return this.http.post<Conductor>(this.conductoresBase, body);
  }

  actualizarConductor(id: number, body: ConductorRequest): Observable<Conductor> {
    return this.http.put<Conductor>(`${this.conductoresBase}/${id}`, body);
  }

  cambiarEstadoConductor(id: number, activo: boolean): Observable<void> {
    const params = new HttpParams().set('activo', activo);
    return this.http.patch<void>(`${this.conductoresBase}/${id}/estado`, null, { params });
  }
}
