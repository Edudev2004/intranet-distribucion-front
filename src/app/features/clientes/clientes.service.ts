import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ClienteOpcionDTO,
  ClienteRequestDTO,
  ClienteResponseDTO,
  TipoDocumentoDTO
} from './cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private readonly apiUrl = `${environment.apiUrl}/clientes`;

  constructor(private readonly http: HttpClient) {}

  listar(filtro?: string, soloActivos?: boolean): Observable<ClienteResponseDTO[]> {
    let params = new HttpParams();
    if (filtro && filtro.trim().length > 0) {
      params = params.set('filtro', filtro.trim());
    }
    if (soloActivos !== undefined) {
      params = params.set('soloActivos', soloActivos.toString());
    }
    return this.http.get<ClienteResponseDTO[]>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<ClienteResponseDTO> {
    return this.http.get<ClienteResponseDTO>(`${this.apiUrl}/${id}`);
  }

  crear(request: ClienteRequestDTO): Observable<ClienteResponseDTO> {
    return this.http.post<ClienteResponseDTO>(this.apiUrl, request);
  }

  actualizar(id: number, request: ClienteRequestDTO): Observable<ClienteResponseDTO> {
    return this.http.put<ClienteResponseDTO>(`${this.apiUrl}/${id}`, request);
  }

  cambiarEstado(id: number, activo: boolean): Observable<void> {
    const params = new HttpParams().set('activo', activo.toString());
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado`, {}, { params });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarTiposDocumento(): Observable<TipoDocumentoDTO[]> {
    return this.http.get<TipoDocumentoDTO[]>(`${this.apiUrl}/tipos-documento`);
  }

  listarOpciones(): Observable<ClienteOpcionDTO[]> {
    return this.http.get<ClienteOpcionDTO[]>(`${this.apiUrl}/opciones`);
  }
}
