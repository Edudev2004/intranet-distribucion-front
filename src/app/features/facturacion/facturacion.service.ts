import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Comprobante,
  ComprobanteRequest,
  PedidoOpcion,
  TipoComprobante,
} from './comprobante.model';

@Injectable({ providedIn: 'root' })
export class FacturacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/comprobantes`;

  listar(idPedido?: number | null, idTipoComprobante?: number | null): Observable<Comprobante[]> {
    let params = new HttpParams();
    if (idPedido) {
      params = params.set('idPedido', idPedido);
    }
    if (idTipoComprobante) {
      params = params.set('idTipoComprobante', idTipoComprobante);
    }
    return this.http.get<Comprobante[]>(this.base, { params });
  }

  tipos(): Observable<TipoComprobante[]> {
    return this.http.get<TipoComprobante[]>(`${this.base}/tipos`);
  }

  emitir(body: ComprobanteRequest): Observable<Comprobante> {
    return this.http.post<Comprobante>(this.base, body);
  }

  // Se descarga con HttpClient para que el interceptor agregue el token
  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/pdf`, { responseType: 'blob' });
  }

  pedidos(): Observable<PedidoOpcion[]> {
    return this.http.get<PedidoOpcion[]>(`${environment.apiUrl}/pedidos`);
  }
}
