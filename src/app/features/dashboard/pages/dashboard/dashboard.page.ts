import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [PageHeaderComponent, StatusBadgeComponent],
  template: `
    <app-page-header title="Resumen de Distribución" subtitle="Métricas y estado general de despachos del día">
      <button class="btn-secundary">📥 Exportar Reporte</button>
    </app-page-header>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon icon-blue">📦</div>
        <div class="kpi-info">
          <span class="kpi-value">148</span>
          <span class="kpi-label">Despachos Pendientes</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon icon-yellow">🚚</div>
        <div class="kpi-info">
          <span class="kpi-value">32</span>
          <span class="kpi-label">Rutas en Tránsito</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon icon-green">✅</div>
        <div class="kpi-info">
          <span class="kpi-value">912</span>
          <span class="kpi-label">Entregas Completadas</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon icon-red">⚠️</div>
        <div class="kpi-info">
          <span class="kpi-value">5</span>
          <span class="kpi-label">Alertas de Retraso</span>
        </div>
      </div>
    </div>

    <div class="recent-routes">
      <h3>Últimas Rutas Activas</h3>
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
    .btn-secundary {
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      background: white;
      padding: 1.25rem;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .kpi-icon {
      font-size: 1.75rem;
      width: 50px;
      height: 50px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-blue { background-color: #e0f2fe; }
    .icon-yellow { background-color: #fef3c7; }
    .icon-green { background-color: #d1fae5; }
    .icon-red { background-color: #fee2e2; }
    .kpi-info {
      display: flex;
      flex-direction: column;
    }
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }
    .kpi-label {
      font-size: 0.8rem;
      color: #64748b;
    }
    .recent-routes {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .recent-routes h3 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      color: #1e293b;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th, .data-table td {
      padding: 0.875rem 1rem;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.9rem;
    }
    .data-table th {
      color: #475569;
      background-color: #f8fafc;
      font-weight: 600;
    }
  `]
})
export class DashboardPageComponent {}
