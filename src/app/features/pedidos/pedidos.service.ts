import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlmacenOpcion,
  ClienteOpcion,
  PedidoDetalle,
  PedidoRequest,
  PedidoResumen,
  ProductoDisponible,
} from './pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/pedidos`;

  listar(idEstado?: number | null): Observable<PedidoResumen[]> {
    let params = new HttpParams();
    if (idEstado) {
      params = params.set('idEstado', idEstado);
    }
    return this.http.get<PedidoResumen[]>(this.base, { params });
  }

  obtener(id: number): Observable<PedidoDetalle> {
    return this.http.get<PedidoDetalle>(`${this.base}/${id}`);
  }

  clientes(): Observable<ClienteOpcion[]> {
    return this.http.get<ClienteOpcion[]>(`${this.base}/clientes`);
  }

  productos(idAlmacen: number): Observable<ProductoDisponible[]> {
    const params = new HttpParams().set('idAlmacen', idAlmacen);
    return this.http.get<ProductoDisponible[]>(`${this.base}/productos`, { params });
  }

  almacenes(): Observable<AlmacenOpcion[]> {
    return this.http.get<AlmacenOpcion[]>(`${environment.apiUrl}/almacenes`);
  }

  crear(body: PedidoRequest): Observable<PedidoDetalle> {
    return this.http.post<PedidoDetalle>(this.base, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}