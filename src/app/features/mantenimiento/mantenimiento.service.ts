import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Mantenimiento,
  MantenimientoRequest,
  TipoMantenimiento,
  VehiculoOpcion,
} from './mantenimiento.model';

@Injectable({ providedIn: 'root' })
export class MantenimientoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/mantenimientos`;

  listar(idVehiculo?: number | null): Observable<Mantenimiento[]> {
    let params = new HttpParams();
    if (idVehiculo) {
      params = params.set('idVehiculo', idVehiculo);
    }
    return this.http.get<Mantenimiento[]>(this.base, { params });
  }

  tipos(): Observable<TipoMantenimiento[]> {
    return this.http.get<TipoMantenimiento[]>(`${this.base}/tipos`);
  }

  vehiculos(): Observable<VehiculoOpcion[]> {
    return this.http.get<VehiculoOpcion[]>(`${this.base}/vehiculos`);
  }

  crear(body: MantenimientoRequest): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(this.base, body);
  }

  actualizar(id: number, body: MantenimientoRequest): Observable<Mantenimiento> {
    return this.http.put<Mantenimiento>(`${this.base}/${id}`, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}