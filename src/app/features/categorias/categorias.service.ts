import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria, CategoriaRequest } from './categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/categorias`;

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.base);
  }

  crear(body: CategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(this.base, body);
  }

  actualizar(id: number, body: CategoriaRequest): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.base}/${id}`, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
