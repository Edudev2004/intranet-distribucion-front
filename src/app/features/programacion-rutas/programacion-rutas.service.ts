import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AsignacionPedidosResponse,
  AsignarPedidosRequest,
  ConductorOpcion,
  PedidoDisponibleAsignacion,
  ProgramacionRuta,
  ProgramacionRutaRequest,
  ResumenCargaRuta,
  RutaOpcion,
  VehiculoOpcion,
} from './programacion-ruta.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProgramacionRutasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/programacion-rutas`;

  listarTodas(): Observable<ProgramacionRuta[]> {
    return this.http.get<ProgramacionRuta[]>(this.apiUrl);
  }

  registrarAsignacion(data: ProgramacionRutaRequest): Observable<ProgramacionRuta> {
    return this.http.post<ProgramacionRuta>(this.apiUrl, data);
  }

  actualizarEstado(id: number, idEstado: number): Observable<ProgramacionRuta> {
    return this.http.patch<ProgramacionRuta>(`${this.apiUrl}/${id}/estado?idEstado=${idEstado}`, {});
  }

  // === RF-15: ASIGNACIÓN DE PEDIDOS A RUTAS ===
  listarPedidosDisponibles(idAlmacen?: number, idZona?: number): Observable<PedidoDisponibleAsignacion[]> {
    let params = new HttpParams();
    if (idAlmacen) params = params.set('idAlmacen', idAlmacen.toString());
    if (idZona) params = params.set('idZona', idZona.toString());
    return this.http.get<PedidoDisponibleAsignacion[]>(`${this.apiUrl}/pedidos-disponibles`, { params });
  }

  obtenerResumenCarga(id: number): Observable<ResumenCargaRuta> {
    return this.http.get<ResumenCargaRuta>(`${this.apiUrl}/${id}/resumen-carga`);
  }

  asignarPedidos(id: number, request: AsignarPedidosRequest): Observable<AsignacionPedidosResponse> {
    return this.http.post<AsignacionPedidosResponse>(`${this.apiUrl}/${id}/asignar-pedidos`, request);
  }

  autoAsignarPedidos(id: number): Observable<AsignacionPedidosResponse> {
    return this.http.post<AsignacionPedidosResponse>(`${this.apiUrl}/${id}/auto-asignar-pedidos`, {});
  }

  desasignarPedido(idProgramacion: number, idPedido: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idProgramacion}/pedidos/${idPedido}`);
  }

  // === OPCIONES AUXILIARES ===
  listarRutas(): Observable<RutaOpcion[]> {
    return this.http.get<RutaOpcion[]>(`${environment.apiUrl}/rutas`);
  }

  listarVehiculos(): Observable<VehiculoOpcion[]> {
    return this.http.get<VehiculoOpcion[]>(`${environment.apiUrl}/vehiculos`);
  }

  listarConductores(): Observable<ConductorOpcion[]> {
    return this.http.get<ConductorOpcion[]>(`${environment.apiUrl}/conductores`);
  }
}
