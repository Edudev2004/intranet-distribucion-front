import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [PageHeaderComponent, StatusBadgeComponent, IconComponent],
  template: `
    <app-page-header title="Centro de Control & Distribución" subtitle="Métricas en tiempo real, estado operativo de rutas y despachos">
      <button class="btn-secondary">
        <app-icon name="reports" [size]="16"></app-icon>
        <span>Exportar Reporte</span>
      </button>
      <button class="btn-primary">
        <app-icon name="truck" [size]="16"></app-icon>
        <span>Nueva Ruta</span>
      </button>
    </app-page-header>

    <!-- KPI Grid Promolider Style -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon icon-blue">
          <app-icon name="orders" [size]="24"></app-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-value">148</span>
          <span class="kpi-label">Despachos Pendientes</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-green">
          <app-icon name="truck" [size]="24"></app-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-value">32</span>
          <span class="kpi-label">Rutas en Tránsito</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-emerald">
          <app-icon name="check" [size]="24"></app-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-value">912</span>
          <span class="kpi-label">Entregas Completadas</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-red">
          <app-icon name="alert" [size]="24"></app-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-value">5</span>
          <span class="kpi-label">Alertas de Retraso</span>
        </div>
      </div>
    </div>

    <!-- Tabla de Rutas Activas Promolider Style -->
    <div class="content-card">
      <div class="card-header">
        <div class="card-title-group">
          <app-icon name="truck" [size]="20"></app-icon>
          <h3>Últimas Rutas Activas</h3>
        </div>
        <span class="badge info">Actualizado hace 2 min</span>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Código Ruta</th>
            <th>Conductor</th>
            <th>Vehículo</th>
            <th>Destino</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>RUT-4091</strong></td>
            <td>Carlos Mendoza</td>
            <td>Camión Volvo (ABC-123)</td>
            <td>Lima Norte - Zonal 3</td>
            <td><app-status-badge status="EN_RUTA" label="En Ruta"></app-status-badge></td>
          </tr>
          <tr>
            <td><strong>RUT-4092</strong></td>
            <td>Juan Pérez</td>
            <td>Furgón Hyundai (XYZ-789)</td>
            <td>Callao - Almacén Central</td>
            <td><app-status-badge status="ENTREGADO" label="Entregado"></app-status-badge></td>
          </tr>
          <tr>
            <td><strong>RUT-4093</strong></td>
            <td>Miguel Ángel Rossi</td>
            <td>Camión Scania (DEF-456)</td>
            <td>Surco - Sucursal 12</td>
            <td><app-status-badge status="PENDIENTE" label="Pendiente"></app-status-badge></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.75rem;
    }

    .kpi-card {
      background: #ffffff;
      padding: 1.4rem;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 1.15rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(226, 232, 240, 0.9);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
    }

    .kpi-icon {
      width: 52px;
      height: 52px;
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
      font-size: 0.825rem;
      font-weight: 500;
      color: #64748b;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .card-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #0f172a;
    }

    .card-title-group h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
    }
  `]
})
export class DashboardPageComponent {}
