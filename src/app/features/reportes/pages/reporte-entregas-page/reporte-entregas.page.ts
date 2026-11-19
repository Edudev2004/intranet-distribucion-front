import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ReportesService } from '../../reportes.service';
import {
  FiltrosReporteEntrega,
  ReporteEntrega,
} from '../../reporte-entrega.model';

@Component({
  selector: 'app-reporte-entregas-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, DecimalPipe, PageHeaderComponent],
  template: `
    <app-page-header
      title="Reporte de Entregas & Cumplimiento"
      subtitle="Efectividad en entregas (OTD), puntualidad por ruta y registro de cumplimiento"
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

    <!-- Navegación entre módulos de reportes -->
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

    <!-- Tarjetas de métricas consolidadas -->
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Total Entregas</span>
        <div class="metric-value">{{ reporte()?.totalEntregas ?? 0 }}</div>
        <span class="metric-sub">Despachos programados</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">% Cumplimiento (OTD)</span>
        <div class="metric-value" [ngClass]="obtenerClasePorcentaje(reporte()?.porcentajeCumplimiento ?? 0)">
          {{ (reporte()?.porcentajeCumplimiento ?? 0) | number: '1.1-1' }}%
        </div>
        <span class="metric-sub">Entregas dentro de ventana horaria</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Entregas A Tiempo</span>
        <div class="metric-value text-success">{{ reporte()?.totalATiempo ?? 0 }}</div>
        <span class="metric-sub">Completadas sin retraso</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Con Retraso</span>
        <div class="metric-value text-danger">{{ reporte()?.totalConRetraso ?? 0 }}</div>
        <span class="metric-sub">Fuera de hora programada</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Pendientes de Entrega</span>
        <div class="metric-value text-muted">{{ reporte()?.totalPendientes ?? 0 }}</div>
        <span class="metric-sub">En tránsito o asignadas</span>
      </div>
    </div>

    <!-- Panel de filtros y resultados -->
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
          Estado de Entrega
          <select
            [ngModel]="filtros.idEstado"
            (ngModelChange)="filtrar({ idEstado: $event ? +$event : null })"
          >
            <option [ngValue]="null">Todos los estados</option>
            <option [ngValue]="1">Asignada</option>
            <option [ngValue]="2">En Tránsito</option>
            <option [ngValue]="3">Entregado</option>
            <option [ngValue]="4">No Entregado / Incidencia</option>
          </select>
        </label>
        <div class="toolbar-actions">
          <button type="button" class="btn-clean" (click)="limpiarFiltros()">
            Limpiar filtros
          </button>
        </div>
      </div>

      @if (reporte(); as r) {
        <p class="resumen">
          Generado: <strong>{{ r.generadoEn | date: 'dd/MM/yyyy HH:mm' }}</strong>
          · Total despachos: <strong>{{ r.totalEntregas }}</strong>
          · Cumplimiento global: <strong>{{ r.porcentajeCumplimiento | number: '1.1-1' }}%</strong>
          @if (filtros.fechaInicio || filtros.fechaFin) {
            · Periodo: <strong>{{ filtros.fechaInicio || 'Inicio' }} al {{ filtros.fechaFin || 'Hoy' }}</strong>
          }
        </p>
      }

      <!-- Tabla de datos de entregas -->
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID Entrega</th>
              <th>Pedido #</th>
              <th>Cliente</th>
              <th>Dirección de Destino</th>
              <th>Hora Estimada</th>
              <th>Hora Real</th>
              <th>Cumplimiento</th>
              <th>Estado</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            @if (cargando()) {
              <tr>
                <td colspan="9">
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <span>Cargando reporte de entregas y cumplimiento...</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (item of reporte()?.items ?? []; track item.idEntrega) {
                <tr>
                  <td><strong>#{{ item.idEntrega }}</strong></td>
                  <td>
                    <span class="pedido-ref">#{{ item.idPedido }}</span>
                  </td>
                  <td>{{ item.cliente }}</td>
                  <td class="direccion-cell" [title]="item.direccion">{{ item.direccion }}</td>
                  <td>{{ item.horaEstimada || 'Sin hora est.' }}</td>
                  <td>{{ item.horaEntregaReal || 'Pendiente' }}</td>
                  <td>
                    <span class="badge" [ngClass]="obtenerClaseCumplimiento(item.cumplimiento)">
                      {{ item.cumplimiento }}
                    </span>
                  </td>
                  <td>
                    <span class="badge-estado">{{ item.estadoEntrega }}</span>
                  </td>
                  <td class="notas-cell">{{ item.notas || 'Sin incidencias' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="empty-state">
                    No se encontraron registros de entrega para los filtros seleccionados.
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
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
    .nav-tab:hover {
      color: #0f172a;
      background: #f8fafc;
    }
    .nav-tab.active {
      color: #052e16;
      border-bottom-color: var(--primary-color, #18d600);
      background: #f0fdf4;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
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
    .metric-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
    }
    .metric-value.text-success { color: #16a34a; }
    .metric-value.text-warning { color: #d97706; }
    .metric-value.text-danger { color: #dc2626; }
    .metric-value.text-muted { color: #64748b; }
    .metric-sub {
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .content-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 1.5rem;
    }
    .toolbar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      align-items: flex-end;
      margin-bottom: 1.25rem;
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
      transition: border-color 0.2s;
    }
    .toolbar input:focus, .toolbar select:focus {
      border-color: #18d600;
      background: #ffffff;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
    }
    .btn-clean {
      padding: 0.55rem 1rem;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.2s;
      width: 100%;
    }
    .btn-clean:hover {
      background: #e2e8f0;
      color: #0f172a;
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
      transition: all 0.2s ease;
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
      transition: all 0.2s ease;
    }
    .btn-primary:hover:not(:disabled) {
      filter: brightness(1.05);
      transform: translateY(-1px);
    }
    .btn-secondary:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-primary:disabled, .btn-secondary:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .btn-icon {
      width: 16px;
      height: 16px;
    }

    .resumen {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      color: #475569;
    }
    .table-wrap {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }
    .data-table th, .data-table td {
      padding: 0.85rem 1rem;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
    }
    .data-table th {
      color: #475569;
      background: #f8fafc;
      font-weight: 600;
      white-space: nowrap;
    }
    .data-table tbody tr:hover {
      background: #fafafa;
    }
    .pedido-ref {
      font-weight: 600;
      color: #0369a1;
      background: #f0f9ff;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }
    .direccion-cell {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .notas-cell {
      color: #64748b;
      font-size: 0.82rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge-a-tiempo { background: #dcfce7; color: #166534; }
    .badge-con-retraso { background: #fee2e2; color: #991b1b; }
    .badge-pendiente { background: #e0f2fe; color: #0369a1; }
    .badge-no-entregado { background: #fef3c7; color: #92400e; }
    .badge-default { background: #f1f5f9; color: #475569; }

    .badge-estado {
      font-size: 0.8rem;
      color: #475569;
      font-weight: 500;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
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
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #94a3b8;
      font-style: italic;
    }
    .alert {
      padding: 0.85rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
    }
    .alert.err {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
  `],
})
export class ReporteEntregasPageComponent implements OnInit {
  private service = inject(ReportesService);
  private consulta?: Subscription;

  reporte = signal<ReporteEntrega | null>(null);

  cargando = signal(false);
  descargando = signal<'pdf' | 'excel' | null>(null);
  error = signal('');

  filtros: FiltrosReporteEntrega = {
    fechaInicio: null,
    fechaFin: null,
    idEstado: null,
  };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.consulta?.unsubscribe();
    this.error.set('');
    this.cargando.set(true);
    this.consulta = this.service.entregas(this.filtros).subscribe({
      next: data => {
        this.reporte.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.reporte.set(null);
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudo cargar el reporte de entregas');
      },
    });
  }

  filtrar(cambio: Partial<FiltrosReporteEntrega>): void {
    this.filtros = { ...this.filtros, ...cambio };
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtros = {
      fechaInicio: null,
      fechaFin: null,
      idEstado: null,
    };
    this.cargar();
  }

  descargar(formato: 'pdf' | 'excel'): void {
    this.error.set('');
    this.descargando.set(formato);
    this.service.descargarEntregas(formato, this.filtros).subscribe({
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

  obtenerClasePorcentaje(porcentaje: number): string {
    if (porcentaje >= 90) return 'text-success';
    if (porcentaje >= 75) return 'text-warning';
    return 'text-danger';
  }

  obtenerClaseCumplimiento(cumplimiento?: string): string {
    const norm = (cumplimiento || '').toUpperCase();
    if (norm.includes('A TIEMPO')) return 'badge-a-tiempo';
    if (norm.includes('RETRASO')) return 'badge-con-retraso';
    if (norm.includes('PENDIENTE')) return 'badge-pendiente';
    if (norm.includes('NO ENTREGADO')) return 'badge-no-entregado';
    return 'badge-default';
  }

  private guardarArchivo(archivo: Blob, formato: 'pdf' | 'excel'): void {
    const fecha = formatDate(new Date(), 'yyyyMMdd_HHmm', 'en-US');
    const extension = formato === 'pdf' ? 'pdf' : 'xlsx';
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte_entregas_${fecha}.${extension}`;
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
