import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RutaRequestDTO, RutaResponseDTO } from './ruta.model';

@Injectable({
  providedIn: 'root'
})
export class RutasService {
  private readonly apiUrl = `${environment.apiUrl}/rutas`;

  constructor(private readonly http: HttpClient) {}

  listar(idZona?: number, soloActivos?: boolean): Observable<RutaResponseDTO[]> {
    let params = new HttpParams();
    if (idZona !== undefined && idZona !== null) {
      params = params.set('idZona', idZona.toString());
    }
    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('activos', soloActivos.toString());
    }
    return this.http.get<RutaResponseDTO[]>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<RutaResponseDTO> {
    return this.http.get<RutaResponseDTO>(`${this.apiUrl}/${id}`);
  }

  crear(request: RutaRequestDTO): Observable<RutaResponseDTO> {
    return this.http.post<RutaResponseDTO>(this.apiUrl, request);
  }

  actualizar(id: number, request: RutaRequestDTO): Observable<RutaResponseDTO> {
    return this.http.put<RutaResponseDTO>(`${this.apiUrl}/${id}`, request);
  }

  cambiarEstado(id: number, activo: boolean): Observable<void> {
    const params = new HttpParams().set('activo', activo.toString());
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, {}, { params });
  }
}
