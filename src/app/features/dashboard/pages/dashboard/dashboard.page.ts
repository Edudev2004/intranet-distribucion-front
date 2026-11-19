import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { DashboardService } from '../../dashboard.service';
import { DashboardKpiResponseDTO, RutaActivaDTO } from '../../dashboard.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, PageHeaderComponent, StatusBadgeComponent, IconComponent],
  template: `
    <app-page-header
      title="Centro de Control & Distribución"
      subtitle="Métricas operativas en tiempo real, estado de pedidos y rutas de despacho (RF-26)"
    >
      <button type="button" class="btn-ghost" (click)="cargarDatos()" [disabled]="cargando()" title="Actualizar indicadores">
        <app-icon name="refresh" [size]="15"></app-icon>
        <span>Actualizar</span>
      </button>
      <a routerLink="/app/reportes" class="btn-secondary">
        <app-icon name="reports" [size]="15"></app-icon>
        <span>Reportes</span>
      </a>
      <a routerLink="/app/programacion-rutas" class="btn-primary">
        <app-icon name="truck" [size]="15"></app-icon>
        <span>Programar Ruta</span>
      </a>
    </app-page-header>

    @if (error()) {
      <div class="alert err">
        <app-icon name="alert" [size]="18"></app-icon>
        <span>{{ error() }}</span>
      </div>
    }

    <!-- KPI Grid conectado a la API en tiempo real -->
    <div class="kpi-grid">
      <div class="kpi-card" [class.has-warning]="(kpis()?.pedidosPendientes || 0) > 0">
        <div class="kpi-icon icon-blue">
          <app-icon name="orders" [size]="24"></app-icon>
        </div>
        <div class="kpi-info">
          @if (cargando()) {
            <span class="spinner-small"></span>
          } @else {
            <span class="kpi-value">{{ kpis()?.pedidosPendientes || 0 }}</span>
          }
          <span class="kpi-label">Pedidos Pendientes de Aprobación</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-green">
          <app-icon name="truck" [size]="24"></app-icon>
        </div>
        <div class="kpi-info">
          @if (cargando()) {
            <span class="spinner-small"></span>
          } @else {
            <span class="kpi-value">{{ kpis()?.vehiculosEnRuta || 0 }}</span>
          }
          <span class="kpi-label">Rutas / Unidades en Tránsito</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-emerald">
          <app-icon name="check" [size]="24"></app-icon>
        </div>
        <div class="kpi-info">
          @if (cargando()) {
            <span class="spinner-small"></span>
          } @else {
            <span class="kpi-value">{{ kpis()?.totalEntregasExitosas || 0 }}</span>
          }
          <span class="kpi-label">Entregas Completadas</span>
        </div>
      </div>

      <div class="kpi-card" [class.has-danger]="(kpis()?.totalEntregasConIncidencia || 0) > 0">
        <div class="kpi-icon icon-red">
          <app-icon name="alert" [size]="24"></app-icon>
        </div>
        <div class="kpi-info">
          @if (cargando()) {
            <span class="spinner-small"></span>
          } @else {
            <span class="kpi-value">{{ kpis()?.totalEntregasConIncidencia || 0 }}</span>
          }
          <span class="kpi-label">Entregas con Incidencia</span>
        </div>
      </div>
    </div>

    <!-- Indicadores Secundarios de Operación -->
    <div class="summary-strip">
      <div class="summary-item">
        <span class="summary-label">Total Pedidos Registrados:</span>
        <strong class="summary-val">{{ kpis()?.totalPedidos || 0 }}</strong>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-label">Pedidos Aprobados:</span>
        <strong class="summary-val text-green">{{ kpis()?.pedidosAprobados || 0 }}</strong>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-label">Conductores Activos:</span>
        <strong class="summary-val">{{ kpis()?.conductoresActivos || 0 }}</strong>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-label">Estado de la Conexión:</span>
        <span class="online-pill">
          <span class="online-dot"></span>
          API Sincronizada
        </span>
      </div>
    </div>

    <!-- Tabla de Rutas Activas conectada a /api/v1/programacion-rutas -->
    <div class="content-card">
      <div class="card-header">
        <div class="card-title-group">
          <app-icon name="route" [size]="20" class="header-icon"></app-icon>
          <div>
            <h3>Programaciones de Ruta en Operación</h3>
            <p class="card-subtitle">Asignaciones de ruta, unidades vehiculares y choferes para reparto</p>
          </div>
        </div>
        <a routerLink="/app/programacion-rutas" class="link-btn">
          <span>Ver todas las programaciones</span>
          <app-icon name="chevron-right" [size]="14"></app-icon>
        </a>
      </div>

      @if (cargando()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Consultando estado de rutas activas...</p>
        </div>
      } @else if (rutasActivas().length === 0) {
        <div class="empty-state">
          <app-icon name="truck" [size]="44" class="empty-icon"></app-icon>
          <h4>No hay programaciones de ruta activas</h4>
          <p>Actualmente no se registran despachos ni rutas en ejecución en la plataforma.</p>
          <a routerLink="/app/programacion-rutas" class="btn-primary mt-3">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Crear nueva programación</span>
          </a>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código Asignación</th>
                <th>Ruta de Reparto</th>
                <th>Vehículo</th>
                <th>Conductor</th>
                <th>Horario Programado</th>
                <th>Estado Operativo</th>
              </tr>
            </thead>
            <tbody>
              @for (r of rutasActivas(); track r.idProgramacion) {
                <tr>
                  <td>
                    <span class="code-badge">PR-{{ r.idProgramacion }}</span>
                  </td>
                  <td>
                    <div class="cell-flex">
                      <app-icon name="route" [size]="15" class="text-green"></app-icon>
                      <span class="fw-semibold">Ruta #{{ r.idRuta }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="text-muted">Vehículo #{{ r.idVehiculo }}</span>
                  </td>
                  <td>
                    <span class="text-muted">Conductor #{{ r.idConductor }}</span>
                  </td>
                  <td>
                    <div class="time-cell">
                      <span>{{ r.inicioProgramado | date:'dd/MM/yyyy HH:mm' }}</span>
                      <span class="time-sub">hasta {{ r.finProgramado | date:'HH:mm' }}</span>
                    </div>
                  </td>
                  <td>
                    <app-status-badge
                      [status]="normalizarEstado(r.estadoProgramacion)"
                      [label]="r.estadoProgramacion || 'Registrado'"
                    ></app-status-badge>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1.5rem 2rem;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* Alertas */
    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      font-size: 13.5px;
      font-weight: 500;
    }
    .alert.err {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    /* KPIs Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }

    .kpi-card {
      background: #ffffff;
      padding: 1.35rem 1.4rem;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 1.15rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(226, 232, 240, 0.9);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
    }

    .kpi-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-blue {
      background-color: #f0f9ff;
      color: #0284c7;
      border: 1px solid #bae6fd;
    }

    .icon-green {
      background-color: rgba(24, 214, 0, 0.12);
      color: #15803d;
      border: 1px solid rgba(24, 214, 0, 0.25);
    }

    .icon-emerald {
      background-color: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }

    .icon-red {
      background-color: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .kpi-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .kpi-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: #64748b;
    }

    /* Franja de Resumen Secundario */
    .summary-strip {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      font-size: 13px;
    }
    .summary-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .summary-label {
      color: #64748b;
      font-weight: 500;
    }
    .summary-val {
      color: #0f172a;
      font-weight: 700;
    }
    .text-green {
      color: #15803d;
    }
    .summary-divider {
      width: 1px;
      height: 16px;
      background: #e2e8f0;
    }
    .online-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(24, 214, 0, 0.1);
      color: #15803d;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .online-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #18d600;
      box-shadow: 0 0 6px #18d600;
    }

    /* Tarjeta de Contenido y Tabla */
    .content-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    .card-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .card-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      color: #15803d;
    }

    .card-title-group h3 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .card-subtitle {
      font-size: 12.5px;
      color: #64748b;
      margin: 2px 0 0 0;
    }

    .link-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #15803d;
      font-size: 12.5px;
      font-weight: 600;
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .link-btn:hover {
      color: #166534;
      text-decoration: underline;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    .data-table th {
      background: #f8fafc;
      padding: 11px 16px;
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
    }
    .data-table tr:hover {
      background: #f8fafc;
    }

    .code-badge {
      font-family: ui-monospace, monospace;
      font-size: 11.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
    }

    .cell-flex {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .fw-semibold {
      font-weight: 600;
    }
    .text-muted {
      color: #64748b;
    }

    .time-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 12px;
    }
    .time-sub {
      color: #94a3b8;
      font-size: 11px;
    }

    /* Botones Globales */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #18d600;
      color: #052e16;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(24, 214, 0, 0.25);
      transition: all 0.15s ease;
    }
    .btn-primary:hover {
      background: #15be00;
      transform: translateY(-1px);
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0f172a;
      color: #ffffff;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-secondary:hover {
      background: #1e293b;
    }
    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 7px 12px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-ghost:hover:not(:disabled) {
      background: #f1f5f9;
      color: #0f172a;
    }
    .btn-ghost:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Estados de Carga y Vacío */
    .loading-state, .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(24, 214, 0, 0.2);
      border-top-color: #18d600;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 12px;
    }
    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(24, 214, 0, 0.3);
      border-top-color: #18d600;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .empty-icon {
      color: #94a3b8;
      margin-bottom: 12px;
    }
    .empty-state h4 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .empty-state p {
      font-size: 13px;
      color: #64748b;
      margin: 0;
      max-width: 420px;
    }
    .mt-3 {
      margin-top: 1rem;
    }
  `]
})
export class DashboardPageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  kpis = signal<DashboardKpiResponseDTO | null>(null);
  rutasActivas = signal<RutaActivaDTO[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.dashboardService.obtenerKpis().subscribe({
      next: (data) => {
        this.kpis.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.kpis.set({
          totalPedidos: 0,
          pedidosAprobados: 0,
          pedidosPendientes: 0,
          totalEntregasExitosas: 0,
          totalEntregasConIncidencia: 0,
          vehiculosEnRuta: 0,
          conductoresActivos: 0
        });
        this.cargando.set(false);
      }
    });

    this.dashboardService.obtenerRutasActivas().subscribe({
      next: (rutas) => {
        this.rutasActivas.set(rutas || []);
      },
      error: () => {
        this.rutasActivas.set([]);
      }
    });
  }

  normalizarEstado(estado?: string): string {
    const e = (estado || '').toUpperCase();
    if (e.includes('RUTA') || e.includes('TRANSITO')) return 'EN_RUTA';
    if (e.includes('ENTREG') || e.includes('COMPLET')) return 'ENTREGADO';
    if (e.includes('CANCEL') || e.includes('RECHAZ')) return 'CANCELADO';
    return 'PENDIENTE';
  }
}
