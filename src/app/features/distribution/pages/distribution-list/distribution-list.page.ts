import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-distribution-list-page',
  standalone: true,
  imports: [PageHeaderComponent, StatusBadgeComponent],
  template: `
    <app-page-header title="Gestión de Despachos y Guías de Remisión" subtitle="Asignación y seguimiento de envíos a puntos de entrega">
      <button class="btn-primary">+ Nuevo Despacho</button>
    </app-page-header>

    <div class="content-card">
      <div class="table-actions">
        <input type="text" placeholder="Buscar por guía o cliente..." class="search-input" />
        <select class="filter-select">
          <option value="">Todos los Estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_RUTA">En Ruta</option>
          <option value="ENTREGADO">Entregado</option>
        </select>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Guía Remisión</th>
            <th>Cliente / Destinatario</th>
            <th>Dirección de Entrega</th>
            <th>Bultos / Peso</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>GR-00941</strong></td>
            <td>Comercial San José S.A.C.</td>
            <td>Av. Argentina 1240, Callao</td>
            <td>12 bultos (450 kg)</td>
            <td><app-status-badge status="EN_RUTA" label="En Ruta"></app-status-badge></td>
            <td><button class="btn-sm">Ver Detalle</button></td>
          </tr>
          <tr>
            <td><strong>GR-00942</strong></td>
            <td>Supermercados del Sur</td>
            <td>Av. Benavides 3400, Surco</td>
            <td>5 bultos (120 kg)</td>
            <td><app-status-badge status="PENDIENTE" label="Pendiente"></app-status-badge></td>
            <td><button class="btn-sm">Asignar Ruta</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .btn-primary {
      padding: 0.5rem 1rem;
      background-color: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .content-card {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .table-actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .search-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      width: 300px;
    }
    .filter-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
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
    .btn-sm {
      padding: 0.3rem 0.6rem;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
    }
  `]
})
export class DistributionListPageComponent {}
