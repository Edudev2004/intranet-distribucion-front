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
import {
  FiltrosReportePedido,
  ReportePedido,
} from './reporte-pedido.model';
import {
  FiltrosReporteEntrega,
  ReporteEntrega,
} from './reporte-entrega.model';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private baseInventario = `${environment.apiUrl}/reportes/inventario`;
  private basePedidos = `${environment.apiUrl}/reportes/pedidos`;
  private baseEntregas = `${environment.apiUrl}/reportes/entregas`;

  // === REPORTE DE INVENTARIO (RF-22) ===
  inventario(filtros: FiltrosReporte): Observable<ReporteInventario> {
    return this.http.get<ReporteInventario>(this.baseInventario, { params: this.paramsInventario(filtros) });
  }

  descargarInventario(formato: FormatoReporte, filtros: FiltrosReporte): Observable<Blob> {
    return this.http.get(`${this.baseInventario}/${formato}`, {
      params: this.paramsInventario(filtros),
      responseType: 'blob',
    });
  }

  almacenes(): Observable<AlmacenOpcion[]> {
    return this.http.get<AlmacenOpcion[]>(`${environment.apiUrl}/almacenes`);
  }

  categorias(): Observable<CategoriaOpcion[]> {
    return this.http.get<CategoriaOpcion[]>(`${environment.apiUrl}/categorias`);
  }

  // === REPORTE DE PEDIDOS (RF-23) ===
  pedidos(filtros: FiltrosReportePedido): Observable<ReportePedido> {
    return this.http.get<ReportePedido>(this.basePedidos, { params: this.paramsPedidos(filtros) });
  }

  descargarPedidos(formato: 'pdf' | 'excel', filtros: FiltrosReportePedido): Observable<Blob> {
    return this.http.get(`${this.basePedidos}/${formato}`, {
      params: this.paramsPedidos(filtros),
      responseType: 'blob',
    });
  }

  // === REPORTE DE ENTREGAS & CUMPLIMIENTO (RF-24) ===
  entregas(filtros: FiltrosReporteEntrega): Observable<ReporteEntrega> {
    return this.http.get<ReporteEntrega>(this.baseEntregas, { params: this.paramsEntregas(filtros) });
  }

  descargarEntregas(formato: 'pdf' | 'excel', filtros: FiltrosReporteEntrega): Observable<Blob> {
    return this.http.get(`${this.baseEntregas}/${formato}`, {
      params: this.paramsEntregas(filtros),
      responseType: 'blob',
    });
  }

  private paramsInventario(filtros: FiltrosReporte): HttpParams {
    let params = new HttpParams();
    if (filtros.idAlmacen) {
      params = params.set('idAlmacen', filtros.idAlmacen);
    }
    if (filtros.idCategoria) {
      params = params.set('idCategoria', filtros.idCategoria);
    }
    return params;
  }

  private paramsPedidos(filtros: FiltrosReportePedido): HttpParams {
    let params = new HttpParams();
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }
    if (filtros.idEstado !== undefined && filtros.idEstado !== null) {
      params = params.set('idEstado', filtros.idEstado.toString());
    }
    if (filtros.idCliente !== undefined && filtros.idCliente !== null) {
      params = params.set('idCliente', filtros.idCliente.toString());
    }
    return params;
  }

  private paramsEntregas(filtros: FiltrosReporteEntrega): HttpParams {
    let params = new HttpParams();
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }
    if (filtros.idEstado !== undefined && filtros.idEstado !== null) {
      params = params.set('idEstado', filtros.idEstado.toString());
    }
    return params;
  }
}
