import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-fleet-list-page',
  standalone: true,
  imports: [PageHeaderComponent, StatusBadgeComponent],
  template: `
    <app-page-header title="Gestión de Flota y Conductores" subtitle="Administración de unidades de transporte y asignación de personal">
      <button class="btn-primary">+ Registrar Vehículo</button>
    </app-page-header>

    <div class="content-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Placa / Unidad</th>
            <th>Modelo / Capacidad</th>
            <th>Conductor Asignado</th>
            <th>Licencia</th>
            <th>Estado Vehículo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>ABC-123</strong></td>
            <td>Camión Volvo FH (20 Ton)</td>
            <td>Carlos Mendoza</td>
            <td>A-IIIc (Profesional)</td>
            <td><app-status-badge status="EN_RUTA" label="En Servicio"></app-status-badge></td>
          </tr>
          <tr>
            <td><strong>XYZ-789</strong></td>
            <td>Furgón Hyundai H100 (3.5 Ton)</td>
            <td>Juan Pérez</td>
            <td>A-IIb</td>
            <td><app-status-badge status="DISPONIBLE" label="Disponible"></app-status-badge></td>
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
export class FleetListPageComponent {}
