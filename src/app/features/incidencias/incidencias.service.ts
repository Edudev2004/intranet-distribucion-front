import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Incidencia,
  IncidenciaRequest,
  PedidoOpcion,
  TipoIncidencia,
} from './incidencia.model';

@Injectable({ providedIn: 'root' })
export class IncidenciasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/incidencias`;

  listar(idEntrega?: number | null, idPedido?: number | null): Observable<Incidencia[]> {
    let params = new HttpParams();
    if (idEntrega) {
      params = params.set('idEntrega', idEntrega);
    }
    if (idPedido) {
      params = params.set('idPedido', idPedido);
    }
    return this.http.get<Incidencia[]>(this.base, { params });
  }

  tipos(): Observable<TipoIncidencia[]> {
    return this.http.get<TipoIncidencia[]>(`${this.base}/tipos`);
  }

  registrar(body: IncidenciaRequest): Observable<Incidencia> {
    return this.http.post<Incidencia>(this.base, body);
  }

  pedidos(): Observable<PedidoOpcion[]> {
    return this.http.get<PedidoOpcion[]>(`${environment.apiUrl}/pedidos`);
  }
}
