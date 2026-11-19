import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ZonaRequestDTO, ZonaResponseDTO } from './zona.model';

@Injectable({
  providedIn: 'root'
})
export class ZonasService {
  private readonly apiUrl = `${environment.apiUrl}/zonas`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<ZonaResponseDTO[]> {
    return this.http.get<ZonaResponseDTO[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<ZonaResponseDTO> {
    return this.http.get<ZonaResponseDTO>(`${this.apiUrl}/${id}`);
  }

  crear(request: ZonaRequestDTO): Observable<ZonaResponseDTO> {
    return this.http.post<ZonaResponseDTO>(this.apiUrl, request);
  }

  actualizar(id: number, request: ZonaRequestDTO): Observable<ZonaResponseDTO> {
    return this.http.put<ZonaResponseDTO>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
