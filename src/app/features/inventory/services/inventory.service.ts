import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  InventarioConsulta,
  InventarioItem,
  AlertaStock,
  TipoMovimiento,
  MovimientoRequest,
  AjusteStockRequest,
  MovimientoResponse,
  InventarioFiltros
} from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/inventario`;

  consultarInventario(filtros?: InventarioFiltros): Observable<InventarioConsulta> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.idAlmacen) {
        params = params.set('idAlmacen', filtros.idAlmacen);
      }
      if (filtros.idCategoria) {
        params = params.set('idCategoria', filtros.idCategoria);
      }
      if (filtros.soloBajoStock !== undefined && filtros.soloBajoStock !== null) {
        params = params.set('soloBajoStock', filtros.soloBajoStock.toString());
      }
      if (filtros.buscar && filtros.buscar.trim()) {
        params = params.set('buscar', filtros.buscar.trim());
      }
    }
    return this.http.get<InventarioConsulta>(this.base, { params });
  }

  obtenerAlertas(idAlmacen?: number, idCategoria?: number): Observable<AlertaStock[]> {
    let params = new HttpParams();
    if (idAlmacen) {
      params = params.set('idAlmacen', idAlmacen);
    }
    if (idCategoria) {
      params = params.set('idCategoria', idCategoria);
    }
    return this.http.get<AlertaStock[]>(`${this.base}/alertas`, { params });
  }

  obtenerStockProducto(idAlmacen: number, idProducto: number): Observable<InventarioItem> {
    return this.http.get<InventarioItem>(`${this.base}/${idAlmacen}/${idProducto}`);
  }

  registrarMovimiento(request: MovimientoRequest): Observable<MovimientoResponse> {
    return this.http.post<MovimientoResponse>(`${this.base}/movimientos`, request);
  }

  ajustarStock(request: AjusteStockRequest): Observable<MovimientoResponse> {
    return this.http.post<MovimientoResponse>(`${this.base}/ajuste`, request);
  }

  obtenerTiposMovimiento(): Observable<TipoMovimiento[]> {
    return this.http.get<TipoMovimiento[]>(`${this.base}/tipos-movimiento`);
  }

  obtenerHistorialMovimientos(
    idAlmacen?: number,
    idProducto?: number,
    idTipoMovimiento?: number
  ): Observable<MovimientoResponse[]> {
    let params = new HttpParams();
    if (idAlmacen) {
      params = params.set('idAlmacen', idAlmacen);
    }
    if (idProducto) {
      params = params.set('idProducto', idProducto);
    }
    if (idTipoMovimiento) {
      params = params.set('idTipoMovimiento', idTipoMovimiento);
    }
    return this.http.get<MovimientoResponse[]>(`${this.base}/movimientos`, { params });
  }
}
