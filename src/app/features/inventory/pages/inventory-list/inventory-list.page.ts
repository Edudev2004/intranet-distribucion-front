import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-inventory-list-page',
  standalone: true,
  imports: [PageHeaderComponent, StatusBadgeComponent],
  template: `
    <app-page-header title="Control de Inventario y Almacén" subtitle="Gestión de existencias y movimiento de mercadería">
      <button class="btn-primary">+ Registrar Entrada</button>
    </app-page-header>

    <div class="content-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Producto</th>
            <th>Ubicación Almacén</th>
            <th>Stock Disponible</th>
            <th>Estado Stock</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>PROD-1002</strong></td>
            <td>Aceite Industrial 20L</td>
            <td>Pasillo A - Estante 4</td>
            <td>450 unidades</td>
            <td><app-status-badge status="DISPONIBLE" label="Disponible"></app-status-badge></td>
          </tr>
          <tr>
            <td><strong>PROD-1005</strong></td>
            <td>Filtro de Aire K-90</td>
            <td>Pasillo B - Estante 2</td>
            <td>12 unidades</td>
            <td><app-status-badge status="EN_PROCESO" label="Stock Bajo"></app-status-badge></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .btn-primary {
      padding: 0.5rem 1rem;
      background-color: var(--primary-color, #18d600);
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
export class InventoryListPageComponent {}
