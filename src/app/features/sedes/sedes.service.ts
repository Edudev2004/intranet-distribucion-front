import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponsableSede, Sede, SedeRequest } from './sede.model';

@Injectable({ providedIn: 'root' })
export class SedesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/sedes`;

  listar(soloActivos: boolean = false): Observable<Sede[]> {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return this.http.get<Sede[]>(this.base, { params });
  }

  obtenerPorId(id: number): Observable<Sede> {
    return this.http.get<Sede>(`${this.base}/${id}`);
  }

  responsables(): Observable<ResponsableSede[]> {
    return this.http.get<ResponsableSede[]>(`${this.base}/responsables`);
  }

  crear(body: SedeRequest): Observable<Sede> {
    return this.http.post<Sede>(this.base, body);
  }

  actualizar(id: number, body: SedeRequest): Observable<Sede> {
    return this.http.put<Sede>(`${this.base}/${id}`, body);
  }

  cambiarEstado(id: number, activo: boolean): Observable<Sede> {
    const params = new HttpParams().set('activo', activo);
    return this.http.patch<Sede>(`${this.base}/${id}/estado`, {}, { params });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
