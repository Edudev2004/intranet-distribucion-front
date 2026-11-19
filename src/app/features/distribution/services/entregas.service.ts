import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ActualizarEntregaRequest, Entrega } from '../models/entrega.model';

@Injectable({
  providedIn: 'root'
})
export class EntregasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/entregas`;

  listarPorProgramacion(idProgramacion: number): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(`${this.base}/programacion/${idProgramacion}`);
  }

  actualizarEstado(idEntrega: number, request: ActualizarEntregaRequest): Observable<Entrega> {
    return this.http.patch<Entrega>(`${this.base}/${idEntrega}/estado`, request);
  }
}
