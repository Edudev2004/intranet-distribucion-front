import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Almacen,
  AlmacenRequest,
  ProductoAlmacen,
  SedeOpcion,
  TipoAlmacen,
} from './almacen.model';

@Injectable({ providedIn: 'root' })
export class AlmacenesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/almacenes`;

  listar(idSede?: number | null): Observable<Almacen[]> {
    let params = new HttpParams();
    if (idSede) {
      params = params.set('idSede', idSede);
    }
    return this.http.get<Almacen[]>(this.base, { params });
  }

  tipos(): Observable<TipoAlmacen[]> {
    return this.http.get<TipoAlmacen[]>(`${this.base}/tipos`);
  }

  productos(idAlmacen: number): Observable<ProductoAlmacen[]> {
    return this.http.get<ProductoAlmacen[]>(`${this.base}/${idAlmacen}/productos`);
  }

  crear(body: AlmacenRequest): Observable<Almacen> {
    return this.http.post<Almacen>(this.base, body);
  }

  actualizar(id: number, body: AlmacenRequest): Observable<Almacen> {
    return this.http.put<Almacen>(`${this.base}/${id}`, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  sedes(): Observable<SedeOpcion[]> {
    return this.http.get<SedeOpcion[]>(`${environment.apiUrl}/sedes`);
  }
}