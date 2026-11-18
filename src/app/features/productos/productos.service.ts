import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto, ProductoRequest, CategoriaOpcion, UnidadOpcion } from './producto.model';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/productos`;

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.base);
  }

  crear(body: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.base, body);
  }

  actualizar(id: number, body: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.base}/${id}`, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  categorias(): Observable<CategoriaOpcion[]> {
    return this.http.get<CategoriaOpcion[]>(`${environment.apiUrl}/categorias`);
  }

  unidades(): Observable<UnidadOpcion[]> {
    return of([
      { idUnidad: 1, codigo: 'UND', nombre: 'Unidad' },
      { idUnidad: 2, codigo: 'CJ', nombre: 'Caja x 24 botellas' }
    ]);
  }
}