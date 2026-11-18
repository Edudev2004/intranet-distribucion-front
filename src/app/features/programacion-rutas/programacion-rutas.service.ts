import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProgramacionRuta } from './programacion-ruta.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProgramacionRutasService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:8080'}/programacion-rutas`;

  constructor(private http: HttpClient) {}

  listarTodas(): Observable<ProgramacionRuta[]> {
    return this.http.get<ProgramacionRuta[]>(this.apiUrl);
  }

  registrarAsignacion(data: ProgramacionRuta): Observable<ProgramacionRuta> {
    return this.http.post<ProgramacionRuta>(this.apiUrl, data);
  }

  actualizarEstado(id: number, idEstado: number): Observable<ProgramacionRuta> {
    return this.http.patch<ProgramacionRuta>(`${this.apiUrl}/${id}/estado?idEstado=${idEstado}`, {});
  }
}