import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RolOpcion, SedeOpcion, Usuario, UsuarioRequest } from './usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.base);
  }

  crear(body: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.base, body);
  }

  actualizar(id: number, body: UsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}`, body);
  }

  cambiarEstado(id: number, activo: boolean): Observable<Usuario> {
    const params = new HttpParams().set('activo', activo);
    return this.http.patch<Usuario>(`${this.base}/${id}/estado`, null, { params });
  }

  roles(): Observable<RolOpcion[]> {
    return this.http.get<RolOpcion[]>(`${environment.apiUrl}/roles`);
  }

  sedes(): Observable<SedeOpcion[]> {
    return this.http.get<SedeOpcion[]>(`${environment.apiUrl}/sedes`);
  }
}
