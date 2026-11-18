import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

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
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Asignación de Vehículo, Conductor y Ruta</h2>
      
      <div class="overflow-x-auto bg-white shadow-md rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conductor</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio Programado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            @if (asignaciones.length > 0) {
              @for (item of asignaciones; track item.idProgramacion) {
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.idProgramacion }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.idRuta }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.idVehiculo }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.idConductor }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.inicioProgramado | date:'short' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {{ item.estadoProgramacion }}
                    </span>
                  </td>
                </tr>
              }
            } @else {
              <tr>
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                  No hay asignaciones registradas.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DistributionListPage implements OnInit {
  private http = inject(HttpClient);
  asignaciones: ProgramacionRuta[] = [];

  ngOnInit() {
    this.cargarAsignaciones();
  }

  cargarAsignaciones() {
    // Apunta directamente a tu API con el interceptor de autenticación activo
    this.http.get<ProgramacionRuta[]>('http://localhost:8080/api/v1/programacion-rutas').subscribe({
      next: (data) => {
        console.log('Datos recibidos de programacion-rutas:', data);
        this.asignaciones = data;
      },
      error: (err) => {
        console.error('Error al cargar las programaciones de ruta:', err);
      }
    });
  }
}