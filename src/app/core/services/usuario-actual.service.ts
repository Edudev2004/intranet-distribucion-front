import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

interface UsuarioSesion {
  idUsuario: number;
  correo: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioActualService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // El login solo devuelve el token: el id real se obtiene con el correo de la sesión
  obtenerId(): Observable<number> {
    const correo = this.authService.currentUser()?.email?.trim().toLowerCase();
    return this.http.get<UsuarioSesion[]>(`${environment.apiUrl}/usuarios`).pipe(
      map(usuarios => {
        const usuario = usuarios.find(u => u.correo.toLowerCase() === correo);
        if (!usuario) {
          throw new HttpErrorResponse({
            status: 404,
            error: { mensaje: 'No se encontró el usuario de la sesión. Vuelva a iniciar sesión.' },
          });
        }
        return usuario.idUsuario;
      }),
    );
  }
}
