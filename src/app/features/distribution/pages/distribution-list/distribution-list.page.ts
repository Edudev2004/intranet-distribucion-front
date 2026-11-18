import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

interface ProgramacionRuta {
  idProgramacion: number;
  idRuta: number;
  idVehiculo: number;
  idConductor: number;
  inicioProgramado: string;
  finProgramado: string;
  inicioReal?: string;
  finReal?: string;
  idEstadoProgramacion: number;
  estadoProgramacion: string;
}

@Component({
  selector: 'app-distribution-list',
  standalone: true,
  imports: [CommonModule, DatePipe, PageHeaderComponent],
  template: `
    <app-page-header
      title="Asignación y Despacho de Rutas"
      subtitle="Control de asignación de vehículos, conductores y estados de entrega">
    </app-page-header>

    <div class="content-card">
      <div class="table-wrap">
        <table class="data-table">
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
            @if (cargando) {
              <tr>
                <td colspan="6">
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <span>Cargando programaciones...</span>
                  </div>
                </td>
              </tr>
            } @else if (asignaciones.length > 0) {
              @for (item of asignaciones; track item.idProgramacion) {
                <tr>
                  <td><strong>#{{ item.idProgramacion }}</strong></td>
                  <td>Ruta #{{ item.idRuta }}</td>
                  <td>Vehículo #{{ item.idVehiculo }}</td>
                  <td>Conductor #{{ item.idConductor }}</td>
                  <td>{{ item.inicioProgramado | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <span class="badge" [class.warn]="item.idEstadoProgramacion === 1">
                      {{ item.estadoProgramacion }}
                    </span>
                  </td>
                </tr>
              }
            } @else {
              <tr>
                <td colspan="6" class="empty-state">
                  No hay asignaciones registradas.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-wrap {
      overflow-x: auto;
    }
    .empty-state {
      text-align: center;
      padding: 2rem !important;
      color: #64748b;
    }
  `]
})
export class DistributionListPage implements OnInit {
  private http = inject(HttpClient);
  asignaciones: ProgramacionRuta[] = [];
  cargando = false;

  ngOnInit() {
    this.cargarAsignaciones();
  }

  cargarAsignaciones() {
    this.cargando = true;
    this.http.get<ProgramacionRuta[]>('http://localhost:8080/api/v1/programacion-rutas').subscribe({
      next: (data) => {
        this.asignaciones = data ?? [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar las programaciones de ruta:', err);
        this.cargando = false;
      }
    });
  }
}
