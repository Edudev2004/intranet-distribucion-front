import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramacionRutasService } from './programacion-rutas.service';
import { ProgramacionRuta } from './programacion-ruta.model';

@Component({
  selector: 'app-programacion-rutas-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="route-container">
      <div class="header-section">
        <h1>Asignación de Vehículo, Conductor y Ruta</h1>
      </div>

      <!-- Tabla de Asignaciones -->
      <div class="table-card">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ruta</th>
              <th>Vehículo</th>
              <th>Conductor</th>
              <th>Inicio Programado</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of asignaciones">
              <td>{{ item.idProgramacion }}</td>
              <td>{{ item.idRuta }}</td>
              <td>{{ item.idVehiculo }}</td>
              <td>{{ item.idConductor }}</td>
              <td>{{ item.inicioProgramado | date:'short' }}</td>
              <td>
                <span class="status-badge">
                  {{ item.estadoProgramacion || 'Registrado' }}
                </span>
              </td>
            </tr>
            <tr *ngIf="asignaciones.length === 0">
              <td colspan="6" class="empty-state">No hay asignaciones registradas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .route-container {
      padding: 2rem;
      max-width: 80rem;
      margin: 0 auto;
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f8fafc;
      min-height: 100vh;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }
    .table-card {
      background: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border-radius: 0.75rem;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .custom-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .custom-table th {
      background-color: #1e293b;
      color: #ffffff;
      padding: 0.875rem 1.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .custom-table td {
      padding: 1rem 1.25rem;
      color: #475569;
      font-size: 0.875rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .custom-table tbody tr:hover {
      background-color: #f8fafc;
    }
    .status-badge {
      background-color: #dcfce7;
      color: #166534;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 9999px;
      display: inline-block;
    }
    .empty-state {
      text-align: center;
      color: #94a3b8;
      padding: 2rem;
    }
  `]
})
export class ProgramacionRutasPage implements OnInit {
  asignaciones: ProgramacionRuta[] = [];

  constructor(private programacionRutasService: ProgramacionRutasService) {}

  ngOnInit(): void {
    this.cargarAsignaciones();
  }

  cargarAsignaciones(): void {
    this.programacionRutasService.listarTodas().subscribe({
      next: (data) => {
        this.asignaciones = data;
      },
      error: (err) => {
        console.error('Error al cargar programaciones:', err);
      }
    });
  }
}