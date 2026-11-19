import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ReportesService } from '../../reportes.service';
import {
  FiltrosReporteFlota,
  ReporteProductividadFlota,
} from '../../reporte-flota.model';
import {
  ConductorOpcion,
  VehiculoOpcion,
} from '../../../programacion-rutas/programacion-ruta.model';

@Component({
  selector: 'app-reporte-flota-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, DecimalPipe, PageHeaderComponent],
  template: `
    <app-page-header
      title="Reporte de Productividad de Flota"
      subtitle="Uso de vehículos, desempeño de conductores y tiempos de ruta para optimización logística"
    >
      <div class="header-actions">
        <button class="btn-secondary" [disabled]="descargando() !== null" (click)="descargar('excel')">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="8" y1="13" x2="16" y2="13"></line>
            <line x1="8" y1="17" x2="16" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          {{ descargando() === 'excel' ? 'Generando...' : 'Descargar Excel' }}
        </button>
        <button class="btn-primary" [disabled]="descargando() !== null" (click)="descargar('pdf')">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          {{ descargando() === 'pdf' ? 'Generando...' : 'Descargar PDF' }}
        </button>
      </div>
    </app-page-header>

    <!-- Navegación unificada entre reportes -->
    <nav class="reportes-nav">
      <a routerLink="/app/reportes/inventario" routerLinkActive="active" class="nav-tab">
        Reporte de Inventario
      </a>
      <a routerLink="/app/reportes/pedidos" routerLinkActive="active" class="nav-tab">
        Reporte de Pedidos
      </a>
      <a routerLink="/app/reportes/entregas" routerLinkActive="active" class="nav-tab">
        Reporte de Entregas & Cumplimiento
      </a>
      <a routerLink="/app/reportes/flota" routerLinkActive="active" class="nav-tab">
        Productividad de Flota
      </a>
    </nav>

    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    <!-- Métricas Consolidadas -->
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Rutas Programadas</span>
        <div class="metric-value">{{ reporte()?.totalRutasProgramadas ?? 0 }}</div>
        <span class="metric-sub">Planificadas en el periodo</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Rutas Completadas</span>
        <div class="metric-value text-success">{{ reporte()?.totalRutasCompletadas ?? 0 }}</div>
        <span class="metric-sub">Finalizadas exitosamente</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Tasa Cumplimiento</span>
        <div class="metric-value text-blue">
          {{ (reporte()?.tasaCumplimientoGeneralPct ?? 0) | number: '1.1-1' }}%
        </div>
        <span class="metric-sub">Efectividad global de flota</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Tiempo Promedio</span>
        <div class="metric-value text-amber">{{ reporte()?.tiempoPromedioGeneralFormateado || '0h 00m' }}</div>
        <span class="metric-sub">Duración promedio por ruta</span>
      </div>
    </div>

    <!-- Panel de filtros y opciones -->
    <div class="content-card">
      <div class="toolbar">
        <label>
          Fecha Desde
          <input
            type="date"
            [ngModel]="filtros.fechaInicio"
            (ngModelChange)="filtrar({ fechaInicio: $event || null })"
          />
        </label>
        <label>
          Fecha Hasta
          <input
            type="date"
            [ngModel]="filtros.fechaFin"
            (ngModelChange)="filtrar({ fechaFin: $event || null })"
          />
        </label>
        <label>
          Vehículo
          <select
            [ngModel]="filtros.idVehiculo"
            (ngModelChange)="filtrar({ idVehiculo: $event ? +$event : null })"
          >
            <option [ngValue]="null">Todos los vehículos</option>
            @for (v of vehiculos(); track v.idVehiculo) {
              <option [ngValue]="v.idVehiculo">{{ v.placa }} - {{ v.marca }} {{ v.modelo }}</option>
            }
          </select>
        </label>
        <label>
          Conductor
          <select
            [ngModel]="filtros.idConductor"
            (ngModelChange)="filtrar({ idConductor: $event ? +$event : null })"
          >
            <option [ngValue]="null">Todos los conductores</option>
            @for (c of conductores(); track c.idConductor) {
              <option [ngValue]="c.idConductor">{{ c.nombres }} {{ c.apellidos }} ({{ c.dni }})</option>
            }
          </select>
        </label>
        <div class="toolbar-actions">
          <button type="button" class="btn-clean" (click)="limpiarFiltros()">
            Limpiar filtros
          </button>
        </div>
      </div>

      <!-- Selector de Sub-Vistas del Reporte -->
      <div class="sub-tabs">
        <button
          type="button"
          class="sub-tab"
          [class.active]="vistaActiva() === 'vehiculos'"
          (click)="vistaActiva.set('vehiculos')"
        >
          Desempeño por Vehículo ({{ reporte()?.metricasVehiculos?.length ?? 0 }})
        </button>
        <button
          type="button"
          class="sub-tab"
          [class.active]="vistaActiva() === 'conductores'"
          (click)="vistaActiva.set('conductores')"
        >
          Desempeño por Conductor ({{ reporte()?.metricasConductores?.length ?? 0 }})
        </button>
        <button
          type="button"
          class="sub-tab"
          [class.active]="vistaActiva() === 'detalles'"
          (click)="vistaActiva.set('detalles')"
        >
          Historial de Rutas ({{ reporte()?.detallesRutas?.length ?? 0 }})
        </button>
      </div>

      <!-- TABLA 1: DESEMPEÑO POR VEHÍCULO -->
      @if (vistaActiva() === 'vehiculos') {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Marca & Modelo</th>
                <th class="num">Capacidad (kg)</th>
                <th class="num">Rutas Asignadas</th>
                <th class="num">Rutas Completadas</th>
                <th>Tiempo Promedio</th>
                <th>Tasa de Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              @if (cargando()) {
                <tr><td colspan="7" class="loading-state"><div class="spinner"></div><span>Cargando datos...</span></td></tr>
              } @else {
                @for (v of reporte()?.metricasVehiculos ?? []; track v.idVehiculo) {
                  <tr>
                    <td><span class="placa-badge">{{ v.placa }}</span></td>
                    <td>{{ v.marca }} {{ v.modelo }}</td>
                    <td class="num">{{ (v.capacidadKg ?? 0) | number: '1.0-0' }} kg</td>
                    <td class="num font-bold">{{ v.rutasAsignadas }}</td>
                    <td class="num text-success font-bold">{{ v.rutasCompletadas }}</td>
                    <td>{{ v.tiempoPromedioFormateado }}</td>
                    <td>
                      <div class="progress-cell">
                        <div class="progress-bar-wrap">
                          <div class="progress-bar" [style.width.%]="v.tasaCumplimientoPct"></div>
                        </div>
                        <span class="pct-text font-bold">{{ v.tasaCumplimientoPct | number: '1.1-1' }}%</span>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="7" class="empty-state">No hay métricas de vehículos para el periodo seleccionado.</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      }

      <!-- TABLA 2: DESEMPEÑO POR CONDUCTOR -->
      @if (vistaActiva() === 'conductores') {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Conductor</th>
                <th>DNI</th>
                <th>Licencia</th>
                <th class="num">Rutas Asignadas</th>
                <th class="num">Rutas Completadas</th>
                <th>Tiempo Promedio</th>
                <th>Tasa de Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              @if (cargando()) {
                <tr><td colspan="7" class="loading-state"><div class="spinner"></div><span>Cargando datos...</span></td></tr>
              } @else {
                @for (c of reporte()?.metricasConductores ?? []; track c.idConductor) {
                  <tr>
                    <td><strong>{{ c.nombreCompleto }}</strong></td>
                    <td>{{ c.dni }}</td>
                    <td><span class="licencia-tag">{{ c.nroLicencia }}</span></td>
                    <td class="num font-bold">{{ c.rutasAsignadas }}</td>
                    <td class="num text-success font-bold">{{ c.rutasCompletadas }}</td>
                    <td>{{ c.tiempoPromedioFormateado }}</td>
                    <td>
                      <div class="progress-cell">
                        <div class="progress-bar-wrap">
                          <div class="progress-bar" [style.width.%]="c.tasaCumplimientoPct"></div>
                        </div>
                        <span class="pct-text font-bold">{{ c.tasaCumplimientoPct | number: '1.1-1' }}%</span>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="7" class="empty-state">No hay métricas de conductores para el periodo seleccionado.</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      }

      <!-- TABLA 3: HISTORIAL DE RUTAS -->
      @if (vistaActiva() === 'detalles') {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ruta</th>
                <th>Vehículo</th>
                <th>Conductor</th>
                <th>Inicio Real</th>
                <th>Fin Real</th>
                <th>Duración</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @if (cargando()) {
                <tr><td colspan="8" class="loading-state"><div class="spinner"></div><span>Cargando datos...</span></td></tr>
              } @else {
                @for (d of reporte()?.detallesRutas ?? []; track d.idProgramacion) {
                  <tr>
                    <td><span class="id-tag">#PRG-{{ d.idProgramacion }}</span></td>
                    <td><strong>{{ d.ruta }}</strong></td>
                    <td><span class="placa-badge">{{ d.vehiculoPlaca }}</span></td>
                    <td>{{ d.conductorNombre }}</td>
                    <td>{{ d.inicioReal ? (d.inicioReal | date: 'dd/MM/yyyy HH:mm') : 'No registrado' }}</td>
                    <td>{{ d.finReal ? (d.finReal | date: 'dd/MM/yyyy HH:mm') : 'En curso' }}</td>
                    <td><strong>{{ d.duracionFormateada }}</strong></td>
                    <td>
                      <span class="badge" [class.badge-finalizada]="d.completada" [class.badge-programada]="!d.completada">
                        {{ d.estadoProgramacion }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="8" class="empty-state">No hay detalle de rutas ejecutadas para el filtro seleccionado.</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-actions { display: flex; align-items: center; gap: 0.75rem; }
    .reportes-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 1.5rem;
      padding-bottom: 0.25rem;
    }
    .nav-tab {
      padding: 0.6rem 1.25rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: #64748b;
      text-decoration: none;
      border-radius: 8px 8px 0 0;
      transition: all 0.2s ease;
      border-bottom: 3px solid transparent;
      margin-bottom: -4px;
    }
    .nav-tab:hover { color: #0f172a; background: #f8fafc; }
    .nav-tab.active {
      color: #052e16;
      border-bottom-color: var(--primary-color, #18d600);
      background: #f0fdf4;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .metric-card {
      background: white;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .metric-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .metric-value { font-size: 1.6rem; font-weight: 800; color: #0f172a; }
    .metric-value.text-success { color: #16a34a; }
    .metric-value.text-blue { color: #0284c7; }
    .metric-value.text-amber { color: #d97706; }
    .metric-sub { font-size: 0.78rem; color: #94a3b8; }

    .content-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 1.5rem;
    }
    .toolbar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: flex-end;
      margin-bottom: 1.5rem;
    }
    .toolbar label {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }
    .toolbar input, .toolbar select {
      padding: 0.55rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      background: #f8fafc;
      color: #1e293b;
      outline: none;
    }
    .toolbar input:focus, .toolbar select:focus {
      border-color: #18d600;
      background: #ffffff;
    }
    .toolbar-actions { display: flex; align-items: center; }
    .btn-clean {
      padding: 0.55rem 1rem;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      width: 100%;
    }
    .btn-clean:hover { background: #e2e8f0; color: #0f172a; }

    /* Sub-Tabs */
    .sub-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 1rem;
    }
    .sub-tab {
      background: transparent;
      border: none;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    .sub-tab:hover { color: #0f172a; }
    .sub-tab.active {
      color: #166534;
      border-bottom-color: #166534;
      font-weight: 700;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      background: var(--primary-color, #18d600);
      color: #052e16;
      border: none;
      border-radius: 9px;
      box-shadow: 0 4px 12px var(--primary-glow, rgba(24, 214, 0, 0.2));
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      color: #334155;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) { filter: brightness(1.05); }
    .btn-secondary:hover:not(:disabled) { background: #f8fafc; }
    .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-icon { width: 16px; height: 16px; }

    .table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; }
    .data-table { width: 100%; border-collapse: collapse; background: white; }
    .data-table th, .data-table td {
      padding: 0.85rem 1rem;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
    }
    .data-table th { background: #f8fafc; color: #475569; font-weight: 600; white-space: nowrap; }
    .data-table .num { text-align: right; }
    .font-bold { font-weight: 700; }
    .text-success { color: #16a34a; }

    .placa-badge {
      font-weight: 700;
      font-family: monospace;
      color: #1e293b;
      background: #f1f5f9;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }
    .licencia-tag {
      font-family: monospace;
      font-size: 0.8rem;
      color: #0369a1;
      background: #f0f9ff;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
    }
    .id-tag {
      font-family: monospace;
      font-weight: 700;
      color: #0284c7;
      background: #f0f9ff;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }

    .progress-cell {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      min-width: 140px;
    }
    .progress-bar-wrap {
      flex: 1;
      height: 6px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: #18d600;
      border-radius: 999px;
    }
    .pct-text { font-size: 0.8rem; min-width: 45px; text-align: right; }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-finalizada { background: #dcfce7; color: #166534; }
    .badge-programada { background: #e0f2fe; color: #0369a1; }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 3rem 1rem;
      color: #64748b;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #e2e8f0;
      border-top-color: #18d600;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 3rem 1rem; color: #94a3b8; font-style: italic; }
    .alert { padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: 0.9rem; }
    .alert.err { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
  `],
})
export class ReporteFlotaPageComponent implements OnInit {
  private service = inject(ReportesService);
  private consulta?: Subscription;

  reporte = signal<ReporteProductividadFlota | null>(null);
  vehiculos = signal<VehiculoOpcion[]>([]);
  conductores = signal<ConductorOpcion[]>([]);

  cargando = signal(false);
  descargando = signal<'pdf' | 'excel' | null>(null);
  error = signal('');
  vistaActiva = signal<'vehiculos' | 'conductores' | 'detalles'>('vehiculos');

  filtros: FiltrosReporteFlota = {
    fechaInicio: null,
    fechaFin: null,
    idVehiculo: null,
    idConductor: null,
  };

  ngOnInit(): void {
    this.cargarOpciones();
    this.cargar();
  }

  cargarOpciones(): void {
    this.service.vehiculos().subscribe({
      next: data => this.vehiculos.set(data),
      error: () => {},
    });
    this.service.conductores().subscribe({
      next: data => this.conductores.set(data),
      error: () => {},
    });
  }

  cargar(): void {
    this.consulta?.unsubscribe();
    this.error.set('');
    this.cargando.set(true);
    this.consulta = this.service.productividadFlota(this.filtros).subscribe({
      next: data => {
        this.reporte.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.reporte.set(null);
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudo cargar el reporte de productividad de flota');
      },
    });
  }

  filtrar(cambio: Partial<FiltrosReporteFlota>): void {
    this.filtros = { ...this.filtros, ...cambio };
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtros = {
      fechaInicio: null,
      fechaFin: null,
      idVehiculo: null,
      idConductor: null,
    };
    this.cargar();
  }

  descargar(formato: 'pdf' | 'excel'): void {
    this.error.set('');
    this.descargando.set(formato);
    this.service.descargarProductividadFlota(formato, this.filtros).subscribe({
      next: archivo => {
        this.guardarArchivo(archivo, formato);
        this.descargando.set(null);
      },
      error: err => {
        this.descargando.set(null);
        this.mostrarErrorDescarga(err, formato);
      },
    });
  }

  private guardarArchivo(archivo: Blob, formato: 'pdf' | 'excel'): void {
    const fecha = formatDate(new Date(), 'yyyyMMdd_HHmm', 'en-US');
    const extension = formato === 'pdf' ? 'pdf' : 'xlsx';
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte_productividad_flota_${fecha}.${extension}`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  private async mostrarErrorDescarga(err: HttpErrorResponse, formato: 'pdf' | 'excel'): Promise<void> {
    const porDefecto = `No se pudo descargar el ${formato === 'pdf' ? 'PDF' : 'Excel'}`;
    let detalle: string | undefined;
    if (err.error instanceof Blob) {
      try {
        detalle = JSON.parse(await err.error.text())?.mensaje;
      } catch {
        detalle = undefined;
      }
    }
    this.error.set(detalle ? `${porDefecto}: ${detalle}` : `${porDefecto} (HTTP ${err.status})`);
  }

  private mostrarError(err: HttpErrorResponse, porDefecto: string): void {
    const detalle = err.error?.mensaje ?? err.error?.message ?? err.error?.error;
    this.error.set(detalle ? `${porDefecto}: ${detalle}` : `${porDefecto} (HTTP ${err.status})`);
  }
}
