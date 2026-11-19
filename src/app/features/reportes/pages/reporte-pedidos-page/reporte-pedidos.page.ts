import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ReportesService } from '../../reportes.service';
import { ClientesService } from '../../../clientes/clientes.service';
import { ClienteResponseDTO } from '../../../clientes/cliente.model';
import {
  FiltrosReportePedido,
  ReportePedido,
} from '../../reporte-pedido.model';

@Component({
  selector: 'app-reporte-pedidos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, DecimalPipe, PageHeaderComponent],
  template: `
    <app-page-header title="Reporte de Pedidos" subtitle="Volumen de ventas, estado comercial y exportación oficial">
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
    </nav>

    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    <!-- Tarjetas de métricas consolidadas -->
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Total Pedidos</span>
        <div class="metric-value">{{ reporte()?.totalPedidos ?? 0 }}</div>
        <span class="metric-sub">En el periodo seleccionado</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Monto Total General</span>
        <div class="metric-value">S/ {{ (reporte()?.montoTotalGeneral ?? 0) | number: '1.2-2' }}</div>
        <span class="metric-sub">Suma comercial de pedidos</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Pedidos Aprobados</span>
        <div class="metric-value text-success">{{ totalAprobados() }}</div>
        <span class="metric-sub">Listos o enviados a reparto</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Pedidos Pendientes</span>
        <div class="metric-value text-warning">{{ totalPendientes() }}</div>
        <span class="metric-sub">Requieren validación comercial</span>
      </div>
    </div>

    <!-- Panel de filtros y resultados -->
    <div class="content-card">
      <div class="toolbar">
        <label>
          Desde
          <input
            type="date"
            [ngModel]="filtros.fechaInicio"
            (ngModelChange)="filtrar({ fechaInicio: $event || null })"
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            [ngModel]="filtros.fechaFin"
            (ngModelChange)="filtrar({ fechaFin: $event || null })"
          />
        </label>
        <label>
          Estado
          <select
            [ngModel]="filtros.idEstado"
            (ngModelChange)="filtrar({ idEstado: $event ? +$event : null })"
          >
            <option [ngValue]="null">Todos los estados</option>
            <option [ngValue]="1">Pendiente</option>
            <option [ngValue]="2">Aprobado</option>
            <option [ngValue]="3">Rechazado</option>
            <option [ngValue]="4">En Ruta</option>
            <option [ngValue]="5">Entregado</option>
          </select>
        </label>
        <label>
          Cliente
          <select
            [ngModel]="filtros.idCliente"
            (ngModelChange)="filtrar({ idCliente: $event ? +$event : null })"
          >
            <option [ngValue]="null">Todos los clientes</option>
            @for (c of clientes(); track c.idCliente) {
              <option [ngValue]="c.idCliente">{{ c.nombreRazonSocial }}</option>
            }
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
          · Total registros: <strong>{{ r.totalPedidos }}</strong>
          @if (filtros.fechaInicio || filtros.fechaFin) {
            · Periodo: <strong>{{ filtros.fechaInicio || 'Inicio' }} al {{ filtros.fechaFin || 'Hoy' }}</strong>
          }
        </p>
      }

      <!-- Tabla de datos de pedidos -->
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Almacén</th>
              <th>Fecha Pedido</th>
              <th class="num">Total (S/)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            @if (cargando()) {
              <tr>
                <td colspan="6">
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <span>Cargando reporte de pedidos...</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (item of reporte()?.items ?? []; track item.idPedido) {
                <tr>
                  <td><strong>#{{ item.idPedido }}</strong></td>
                  <td>{{ item.cliente }}</td>
                  <td>{{ item.almacen || 'Principal' }}</td>
                  <td>{{ item.fechaPedido }}</td>
                  <td class="num">S/ {{ item.total | number: '1.2-2' }}</td>
                  <td>
                    <span class="badge" [ngClass]="obtenerClaseEstado(item.estado)">
                      {{ item.estado }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty-state">
                    No se encontraron pedidos para los filtros especificados.
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
    .metric-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
    }
    .metric-value.text-success { color: #16a34a; }
    .metric-value.text-warning { color: #d97706; }
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
    .data-table .num {
      text-align: right;
      white-space: nowrap;
    }
    .data-table tbody tr:hover {
      background: #fafafa;
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
    .badge-aprobado { background: #dcfce7; color: #166534; }
    .badge-pendiente { background: #fef3c7; color: #92400e; }
    .badge-rechazado { background: #fee2e2; color: #991b1b; }
    .badge-en-ruta { background: #e0f2fe; color: #0369a1; }
    .badge-entregado { background: #d1fae5; color: #065f46; }
    .badge-default { background: #f1f5f9; color: #475569; }

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
export class ReportePedidosPageComponent implements OnInit {
  private service = inject(ReportesService);
  private clientesService = inject(ClientesService);
  private consulta?: Subscription;

  reporte = signal<ReportePedido | null>(null);
  clientes = signal<ClienteResponseDTO[]>([]);

  cargando = signal(false);
  descargando = signal<'pdf' | 'excel' | null>(null);
  error = signal('');

  filtros: FiltrosReportePedido = {
    fechaInicio: null,
    fechaFin: null,
    idEstado: null,
    idCliente: null,
  };

  ngOnInit(): void {
    this.cargarClientes();
    this.cargar();
  }

  cargarClientes(): void {
    this.clientesService.listar('', true).subscribe({
      next: data => this.clientes.set(data),
      error: () => {}, // Si falla, el filtro de clientes permanece vacío sin bloquear el reporte
    });
  }

  cargar(): void {
    this.consulta?.unsubscribe();
    this.error.set('');
    this.cargando.set(true);
    this.consulta = this.service.pedidos(this.filtros).subscribe({
      next: data => {
        this.reporte.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.reporte.set(null);
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudo cargar el reporte de pedidos');
      },
    });
  }

  filtrar(cambio: Partial<FiltrosReportePedido>): void {
    this.filtros = { ...this.filtros, ...cambio };
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtros = {
      fechaInicio: null,
      fechaFin: null,
      idEstado: null,
      idCliente: null,
    };
    this.cargar();
  }

  descargar(formato: 'pdf' | 'excel'): void {
    this.error.set('');
    this.descargando.set(formato);
    this.service.descargarPedidos(formato, this.filtros).subscribe({
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

  totalAprobados(): number {
    return this.reporte()?.items?.filter(i => i.idEstadoPedido === 2 || i.estado?.toUpperCase() === 'APROBADO')?.length ?? 0;
  }

  totalPendientes(): number {
    return this.reporte()?.items?.filter(i => i.idEstadoPedido === 1 || i.estado?.toUpperCase() === 'PENDIENTE')?.length ?? 0;
  }

  obtenerClaseEstado(estado?: string): string {
    const norm = (estado || '').toUpperCase();
    if (norm.includes('APROBADO')) return 'badge-aprobado';
    if (norm.includes('PENDIENTE')) return 'badge-pendiente';
    if (norm.includes('RECHAZADO')) return 'badge-rechazado';
    if (norm.includes('RUTA') || norm.includes('DESPACHADO')) return 'badge-en-ruta';
    if (norm.includes('ENTREGADO')) return 'badge-entregado';
    return 'badge-default';
  }

  private guardarArchivo(archivo: Blob, formato: 'pdf' | 'excel'): void {
    const fecha = formatDate(new Date(), 'yyyyMMdd_HHmm', 'en-US');
    const extension = formato === 'pdf' ? 'pdf' : 'xlsx';
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte_pedidos_${fecha}.${extension}`;
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
