import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlmacenOpcion,
  CategoriaOpcion,
  FiltrosReporte,
  FormatoReporte,
  ReporteInventario,
} from './reporte-inventario.model';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reportes/inventario`;

  inventario(filtros: FiltrosReporte): Observable<ReporteInventario> {
    return this.http.get<ReporteInventario>(this.base, { params: this.params(filtros) });
  }

  // Se descarga con HttpClient para que el interceptor agregue el token
  descargarInventario(formato: FormatoReporte, filtros: FiltrosReporte): Observable<Blob> {
    return this.http.get(`${this.base}/${formato}`, {
      params: this.params(filtros),
      responseType: 'blob',
    });
  }

  almacenes(): Observable<AlmacenOpcion[]> {
    return this.http.get<AlmacenOpcion[]>(`${environment.apiUrl}/almacenes`);
  }

  categorias(): Observable<CategoriaOpcion[]> {
    return this.http.get<CategoriaOpcion[]>(`${environment.apiUrl}/categorias`);
  }

  private params(filtros: FiltrosReporte): HttpParams {
    let params = new HttpParams();
    if (filtros.idAlmacen) {
      params = params.set('idAlmacen', filtros.idAlmacen);
    }
    if (filtros.idCategoria) {
      params = params.set('idCategoria', filtros.idCategoria);
    }
    return params;
  }
}
