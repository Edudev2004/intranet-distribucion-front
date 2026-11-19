import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardKpiResponseDTO, RutaActivaDTO } from './dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;
  private readonly programacionesUrl = `${environment.apiUrl}/programacion-rutas`;

  constructor(private readonly http: HttpClient) {}

  obtenerKpis(): Observable<DashboardKpiResponseDTO> {
    return this.http.get<DashboardKpiResponseDTO>(`${this.baseUrl}/kpis`);
  }

  obtenerRutasActivas(): Observable<RutaActivaDTO[]> {
    return this.http.get<RutaActivaDTO[]>(this.programacionesUrl);
  }
}
