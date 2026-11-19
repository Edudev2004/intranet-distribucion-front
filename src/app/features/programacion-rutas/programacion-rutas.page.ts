import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ProgramacionRutasService } from './programacion-rutas.service';
import {
  AsignacionPedidosResponse,
  ConductorOpcion,
  PedidoDisponibleAsignacion,
  ProgramacionRuta,
  ProgramacionRutaRequest,
  ResumenCargaRuta,
  RutaOpcion,
  VehiculoOpcion,
} from './programacion-ruta.model';

@Component({
  selector: 'app-programacion-rutas-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe, PageHeaderComponent],
  template: `
    <app-page-header
      title="Programación de Rutas y Despacho"
      subtitle="Planificación de flota, tripulación y asignación inteligente de pedidos a rutas"
    >
      <button class="btn-primary" (click)="abrirModalNuevaProgramacion()">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nueva Programación
      </button>
    </app-page-header>

    @if (mensajeExito()) {
      <div class="alert ok">
        <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{{ mensajeExito() }}</span>
      </div>
    }

    @if (error()) {
      <div class="alert err">
        <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ error() }}</span>
      </div>
    }

    <!-- Métricas Consolidadas -->
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Total Programaciones</span>
        <div class="metric-value">{{ programaciones().length }}</div>
        <span class="metric-sub">Rutas planificadas o activas</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">En Ejecución</span>
        <div class="metric-value text-amber">{{ totalEnEjecucion() }}</div>
        <span class="metric-sub">Unidades actualmente en ruta</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Carga Promedio</span>
        <div class="metric-value text-success">{{ promedioCarga() | number: '1.0-1' }}%</div>
        <span class="metric-sub">Aprovechamiento de capacidad</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Pedidos en Reparto</span>
        <div class="metric-value text-blue">{{ totalPedidosDespachados() }}</div>
        <span class="metric-sub">En proceso de entrega</span>
      </div>
    </div>

    <!-- Barra de búsqueda y filtros -->
    <div class="content-card">
      <div class="toolbar">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Buscar por ruta, zona, placa o conductor..."
            [ngModel]="filtroTexto()"
            (ngModelChange)="filtroTexto.set($event)"
          />
        </div>

        <div class="filter-box">
          <label>Estado:
            <select [ngModel]="filtroEstado()" (ngModelChange)="filtroEstado.set($event)">
              <option value="TODOS">Todos los estados</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="EN_EJECUCION">En Ejecución</option>
              <option value="FINALIZADA">Finalizada</option>
            </select>
          </label>
        </div>

        <button class="btn-refresh" (click)="cargar()" title="Actualizar datos">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Actualizar
        </button>
      </div>

      <!-- Tabla de Rutas Programadas -->
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ruta & Zona</th>
              <th>Vehículo</th>
              <th>Conductor</th>
              <th>Inicio Programado</th>
              <th>Capacidad & Carga (RF-15)</th>
              <th>Estado</th>
              <th class="actions-header">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @if (cargando()) {
              <tr>
                <td colspan="8">
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <span>Cargando programaciones de rutas...</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (p of programacionesFiltradas(); track p.idProgramacion) {
                <tr>
                  <td>
                    <span class="id-tag">#PRG-{{ p.idProgramacion }}</span>
                  </td>
                  <td>
                    <div class="route-cell">
                      <span class="route-name">{{ p.nombreRuta || ('Ruta #' + p.idRuta) }}</span>
                      <span class="zone-badge">{{ p.nombreZona || 'Zona General' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="vehicle-cell">
                      <span class="placa-badge">{{ p.placaVehiculo || ('VEH-' + p.idVehiculo) }}</span>
                      <span class="sub-text">{{ p.modeloVehiculo || 'Vehículo de flota' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="driver-cell">
                      <span class="driver-name">{{ p.nombreConductor || ('Conductor #' + p.idConductor) }}</span>
                      @if (p.licenciaConductor) {
                        <span class="sub-text">Lic: {{ p.licenciaConductor }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="date-cell">
                      <span>{{ p.inicioProgramado | date: 'dd/MM/yyyy' }}</span>
                      <span class="sub-text">{{ p.inicioProgramado | date: 'HH:mm' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="capacity-cell">
                      <div class="capacity-bar-wrap">
                        <div
                          class="capacity-bar"
                          [style.width.%]="obtenerPorcentajeBarra(p)"
                          [ngClass]="obtenerColorBarra(p)"
                        ></div>
                      </div>
                      <div class="capacity-meta">
                        <strong>{{ (p.pesoOcupadoKg ?? 0) | number: '1.1-1' }} kg</strong> /
                        <span>{{ (p.capacidadVehiculoKg ?? 0) | number: '1.0-0' }} kg</span>
                        <span class="percent-tag">({{ (p.porcentajeOcupacion ?? 0) | number: '1.0-0' }}%)</span>
                        <span class="orders-count">{{ p.totalPedidos ?? 0 }} pedidos</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="obtenerClaseEstado(p.estadoProgramacion)">
                      {{ p.estadoProgramacion || 'Programada' }}
                    </span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <!-- RF-15: Botón para Asignar Pedidos (Abre modal) -->
                      <button
                        type="button"
                        class="btn-action-primary"
                        (click)="abrirModalAsignacion(p)"
                        title="Asignar pedidos y validar capacidad (RF-15)"
                      >
                        <svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                          <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                        Asignar
                      </button>

                      <!-- RF-15: Auto-Asignación Inteligente 1-Click -->
                      <button
                        type="button"
                        class="btn-action-smart"
                        [disabled]="procesandoAuto() === p.idProgramacion"
                        (click)="ejecutarAutoAsignacion(p)"
                        title="Auto-asignar pedidos aprobados inteligentemente según capacidad"
                      >
                        <svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                        {{ procesandoAuto() === p.idProgramacion ? 'Cargando...' : 'Auto' }}
                      </button>

                      <!-- Transición de Estado -->
                      @if (p.idEstadoProgramacion === 1) {
                        <button
                          type="button"
                          class="btn-action-state text-amber"
                          (click)="cambiarEstado(p, 2)"
                          title="Iniciar despacho en ruta"
                        >
                          Iniciar
                        </button>
                      } @else if (p.idEstadoProgramacion === 2) {
                        <button
                          type="button"
                          class="btn-action-state text-success"
                          (click)="cambiarEstado(p, 3)"
                          title="Finalizar ruta de distribución"
                        >
                          Finalizar
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty-state">
                    No se encontraron programaciones que coincidan con los filtros aplicados.
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL RF-15: ASIGNACIÓN DE PEDIDOS A RUTA & CONTROL DE CARGA   -->
    <!-- ============================================================== -->
    @if (modalAsignacionAbierto()) {
      <div class="modal-backdrop" (click)="cerrarModalAsignacion()">
        <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Asignar Pedidos a Ruta (RF-15)</h3>
              <p class="modal-subtitle">
                <strong>{{ rutaSeleccionada()?.nombreRuta }}</strong> ·
                Vehículo: <strong>{{ rutaSeleccionada()?.placaVehiculo }}</strong>
                (Capacidad: {{ rutaSeleccionada()?.capacidadVehiculoKg | number: '1.0-0' }} kg)
              </p>
            </div>
            <button class="btn-close" (click)="cerrarModalAsignacion()">&times;</button>
          </div>

          <!-- Barra de Capacidad en Tiempo Real -->
          <div class="capacity-simulator">
            <div class="sim-header">
              <span class="sim-title">Capacidad y Carga Proyectada</span>
              <div class="sim-values">
                <span>Carga actual: <strong>{{ (resumenCarga()?.pesoOcupadoKg ?? 0) | number: '1.1-1' }} kg</strong></span>
                <span>+ Seleccionado: <strong class="text-blue">{{ pesoSeleccionado() | number: '1.1-1' }} kg</strong></span>
                <span>= Total: <strong [class.text-danger]="excedeCapacidad()">{{ pesoTotalProyectado() | number: '1.1-1' }} / {{ (rutaSeleccionada()?.capacidadVehiculoKg ?? 0) | number: '1.0-0' }} kg</strong></span>
              </div>
            </div>

            <div class="capacity-bar-wrap big">
              <div
                class="capacity-bar"
                [style.width.%]="obtenerPorcentajeProyectado()"
                [class.bar-danger]="excedeCapacidad()"
                [class.bar-warning]="obtenerPorcentajeProyectado() > 80 && !excedeCapacidad()"
              ></div>
            </div>

            @if (excedeCapacidad()) {
              <div class="capacity-alert-danger">
                Capacidad excedida: Se supera el peso máximo del vehículo por {{ (pesoTotalProyectado() - (rutaSeleccionada()?.capacidadVehiculoKg ?? 0)) | number: '1.1-1' }} kg.
              </div>
            }
          </div>

          <!-- Botón de Auto-Asignación Rápida -->
          <div class="modal-tools">
            <button
              type="button"
              class="btn-smart-fill"
              [disabled]="guardandoAsignacion()"
              (click)="autoSeleccionarPedidos()"
              title="Selecciona de forma óptima los pedidos que caben en el camión"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              Auto-Asignado Inteligente
            </button>
            <span class="pedidos-disponibles-count">
              {{ pedidosDisponibles().length }} pedidos aprobados disponibles
            </span>
          </div>

          <!-- Tabla de Pedidos Elegibles -->
          <div class="modal-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 40px;">
                    <input
                      type="checkbox"
                      [checked]="todosSeleccionados()"
                      (change)="alternarTodosLosPedidos($event)"
                    />
                  </th>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Dirección / Zona</th>
                  <th class="num">Peso (kg)</th>
                  <th class="num">Total (S/)</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @if (cargandoDisponibles()) {
                  <tr>
                    <td colspan="7">
                      <div class="loading-state">
                        <div class="spinner"></div>
                        <span>Buscando pedidos disponibles...</span>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (ped of pedidosDisponibles(); track ped.idPedido) {
                    <tr [class.row-selected]="estaPedidoSeleccionado(ped.idPedido)">
                      <td>
                        <input
                          type="checkbox"
                          [checked]="estaPedidoSeleccionado(ped.idPedido)"
                          (change)="alternarSeleccionPedido(ped)"
                        />
                      </td>
                      <td><strong>#{{ ped.idPedido }}</strong></td>
                      <td>{{ ped.cliente }}</td>
                      <td>
                        <div class="dir-cell">
                          <span>{{ ped.direccionEntrega }}</span>
                          <span class="sub-text">{{ ped.zonaCliente || 'Zona no asignada' }}</span>
                        </div>
                      </td>
                      <td class="num font-bold">{{ ped.pesoTotalKg | number: '1.2-2' }} kg</td>
                      <td class="num">S/ {{ ped.importeTotal | number: '1.2-2' }}</td>
                      <td>
                        <span class="badge badge-aprobado">{{ ped.estado }}</span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="empty-state">
                        No hay pedidos en estado 'Aprobado' pendientes de asignación para esta zona.
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <div class="modal-footer">
            <div class="selection-summary">
              <span>Seleccionados: <strong>{{ pedidosSeleccionadosIds.size }}</strong> pedidos</span>
              <span>Peso añadido: <strong>{{ pesoSeleccionado() | number: '1.2-2' }} kg</strong></span>
            </div>
            <div class="footer-buttons">
              <button class="btn-secondary" (click)="cerrarModalAsignacion()">Cancelar</button>
              <button
                class="btn-primary"
                [disabled]="pedidosSeleccionadosIds.size === 0 || excedeCapacidad() || guardandoAsignacion()"
                (click)="confirmarAsignacion()"
              >
                {{ guardandoAsignacion() ? 'Asignando...' : 'Confirmar Asignación' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ============================================================== -->
    <!-- MODAL: NUEVA PROGRAMACIÓN DE RUTA                              -->
    <!-- ============================================================== -->
    @if (modalNuevaProgramacionAbierto()) {
      <div class="modal-backdrop" (click)="cerrarModalNuevaProgramacion()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Nueva Programación de Ruta</h3>
            <button class="btn-close" (click)="cerrarModalNuevaProgramacion()">&times;</button>
          </div>

          <form (ngSubmit)="guardarNuevaProgramacion()" #formProg="ngForm">
            <div class="form-body">
              <label>
                Ruta de Distribución *
                <select name="idRuta" [(ngModel)]="nuevaProgramacion.idRuta" required>
                  <option [ngValue]="null">Selecciona una ruta...</option>
                  @for (r of rutas(); track r.idRuta) {
                    <option [ngValue]="r.idRuta">
                      {{ r.nombre }} @if (r.zona) { ({{ r.zona.nombre }}) }
                    </option>
                  }
                </select>
              </label>

              <label>
                Vehículo Asignado *
                <select name="idVehiculo" [(ngModel)]="nuevaProgramacion.idVehiculo" required>
                  <option [ngValue]="null">Selecciona un vehículo...</option>
                  @for (v of vehiculos(); track v.idVehiculo) {
                    <option [ngValue]="v.idVehiculo">
                      {{ v.placa }} - {{ v.marca }} {{ v.modelo }} (Capacidad: {{ v.capacidadKg }} kg)
                    </option>
                  }
                </select>
              </label>

              <label>
                Conductor Asignado *
                <select name="idConductor" [(ngModel)]="nuevaProgramacion.idConductor" required>
                  <option [ngValue]="null">Selecciona un conductor...</option>
                  @for (c of conductores(); track c.idConductor) {
                    <option [ngValue]="c.idConductor">
                      {{ c.nombres }} {{ c.apellidos }} (Lic: {{ c.nroLicencia }})
                    </option>
                  }
                </select>
              </label>

              <label>
                Fecha y Hora de Inicio Programado *
                <input
                  type="datetime-local"
                  name="inicioProgramado"
                  [(ngModel)]="nuevaProgramacion.inicioProgramado"
                  required
                />
              </label>

              <label>
                Fecha y Hora Estimada de Fin
                <input
                  type="datetime-local"
                  name="finProgramado"
                  [(ngModel)]="nuevaProgramacion.finProgramado"
                />
              </label>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="cerrarModalNuevaProgramacion()">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary"
                [disabled]="!formProg.form.valid || guardandoProgramacion()"
              >
                {{ guardandoProgramacion() ? 'Creando...' : 'Crear Programación' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
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
      font-size: 1.7rem;
      font-weight: 800;
      color: #0f172a;
    }
    .metric-value.text-amber { color: #d97706; }
    .metric-value.text-success { color: #16a34a; }
    .metric-value.text-blue { color: #0284c7; }
    .metric-sub {
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .content-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .search-box {
      flex: 1;
      min-width: 260px;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      padding: 0.55rem 0.85rem;
    }
    .search-box input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 0.9rem;
      color: #1e293b;
    }
    .search-icon {
      width: 18px;
      height: 18px;
      color: #94a3b8;
    }
    .filter-box label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }
    .filter-box select {
      padding: 0.55rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #f8fafc;
      font-size: 0.85rem;
      color: #1e293b;
      outline: none;
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
    .btn-primary:hover:not(:disabled) {
      filter: brightness(1.05);
      transform: translateY(-1px);
    }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

    .btn-secondary {
      padding: 0.6rem 1.25rem;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      color: #334155;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .btn-secondary:hover { background: #f8fafc; }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 1rem;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      color: #475569;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-refresh:hover { background: #e2e8f0; }

    .btn-icon {
      width: 16px;
      height: 16px;
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
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      white-space: nowrap;
    }
    .data-table tbody tr:hover { background: #fafafa; }
    .data-table .num { text-align: right; }

    .id-tag {
      font-family: monospace;
      font-weight: 700;
      color: #0284c7;
      background: #f0f9ff;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }
    .route-cell {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .route-name {
      font-weight: 700;
      color: #0f172a;
    }
    .zone-badge {
      font-size: 0.75rem;
      color: #047857;
      background: #ecfdf5;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      width: fit-content;
      font-weight: 600;
    }
    .vehicle-cell, .driver-cell, .date-cell {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .placa-badge {
      font-weight: 700;
      font-family: monospace;
      color: #1e293b;
      background: #f1f5f9;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      width: fit-content;
    }
    .driver-name {
      font-weight: 600;
      color: #1e293b;
    }
    .sub-text {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Barra de capacidad */
    .capacity-cell {
      min-width: 180px;
    }
    .capacity-bar-wrap {
      width: 100%;
      height: 7px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 0.35rem;
    }
    .capacity-bar-wrap.big {
      height: 12px;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .capacity-bar {
      height: 100%;
      background: #18d600;
      border-radius: 999px;
      transition: width 0.3s ease;
    }
    .capacity-bar.bar-warning { background: #f59e0b; }
    .capacity-bar.bar-danger { background: #ef4444; }
    .capacity-meta {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.78rem;
      color: #64748b;
      white-space: nowrap;
    }
    .percent-tag {
      font-weight: 700;
      color: #0f172a;
    }
    .orders-count {
      margin-left: auto;
      background: #f1f5f9;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 600;
    }

    /* Badges de Estado */
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
    .badge-programada { background: #e0f2fe; color: #0369a1; }
    .badge-ejecucion { background: #fef3c7; color: #92400e; }
    .badge-finalizada { background: #dcfce7; color: #166534; }
    .badge-aprobado { background: #dcfce7; color: #166534; }
    .badge-default { background: #f1f5f9; color: #475569; }

    /* Acciones */
    .actions-header { text-align: center; width: 210px; }
    .row-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
    }
    .btn-action-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.4rem 0.75rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      border-radius: 7px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-action-primary:hover {
      background: #dcfce7;
      border-color: #86efac;
    }
    .btn-action-smart {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.4rem 0.7rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      border-radius: 7px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-action-smart:hover:not(:disabled) {
      background: #dbeafe;
    }
    .btn-action-smart:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-action-state {
      padding: 0.4rem 0.65rem;
      border: 1px solid #cbd5e1;
      background: white;
      border-radius: 7px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-action-state:hover { background: #f8fafc; }
    .act-icon { width: 14px; height: 14px; }

    /* Modales */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.5rem;
    }
    .modal-card {
      background: white;
      border-radius: 14px;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .modal-card.modal-lg {
      max-width: 900px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .modal-header h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .modal-subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.85rem;
      color: #64748b;
    }
    .btn-close {
      border: none;
      background: transparent;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
    }
    .btn-close:hover { color: #0f172a; }

    .capacity-simulator {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 1.5rem;
    }
    .sim-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
    }
    .sim-title { font-weight: 700; color: #334155; }
    .sim-values { display: flex; gap: 0.85rem; font-size: 0.82rem; color: #475569; }
    .capacity-alert-danger {
      margin-top: 0.5rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.5rem 0.85rem;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
    }

    .modal-tools {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      background: #ffffff;
    }
    .btn-smart-fill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-weight: 700;
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .btn-smart-fill:hover { background: #dbeafe; }
    .pedidos-disponibles-count {
      font-size: 0.82rem;
      color: #64748b;
      font-weight: 600;
    }

    .modal-table-wrap {
      overflow-y: auto;
      max-height: 380px;
      padding: 0;
    }
    .row-selected td {
      background: #f0fdf4 !important;
    }
    .dir-cell {
      display: flex;
      flex-direction: column;
    }
    .font-bold { font-weight: 700; }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .selection-summary {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
      color: #475569;
    }
    .footer-buttons {
      display: flex;
      gap: 0.75rem;
    }

    /* Formulario Nueva Programación */
    .form-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
    }
    .form-body label {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }
    .form-body input, .form-body select {
      padding: 0.6rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      background: #f8fafc;
      color: #1e293b;
      outline: none;
    }
    .form-body input:focus, .form-body select:focus {
      border-color: #18d600;
      background: white;
    }

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
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #94a3b8;
      font-style: italic;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
    }
    .alert-icon { width: 18px; height: 18px; flex-shrink: 0; }
    .alert.ok { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .alert.err { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
  `],
})
export class ProgramacionRutasPage implements OnInit {
  private service = inject(ProgramacionRutasService);

  programaciones = signal<ProgramacionRuta[]>([]);
  cargando = signal(false);
  error = signal('');
  mensajeExito = signal('');

  filtroTexto = signal('');
  filtroEstado = signal('TODOS');

  // Modal RF-15: Asignación de pedidos
  modalAsignacionAbierto = signal(false);
  rutaSeleccionada = signal<ProgramacionRuta | null>(null);
  resumenCarga = signal<ResumenCargaRuta | null>(null);
  pedidosDisponibles = signal<PedidoDisponibleAsignacion[]>([]);
  cargandoDisponibles = signal(false);
  guardandoAsignacion = signal(false);
  procesandoAuto = signal<number | null>(null);
  pedidosSeleccionadosIds = new Set<number>();

  // Modal: Nueva Programación
  modalNuevaProgramacionAbierto = signal(false);
  guardandoProgramacion = signal(false);
  rutas = signal<RutaOpcion[]>([]);
  vehiculos = signal<VehiculoOpcion[]>([]);
  conductores = signal<ConductorOpcion[]>([]);
  nuevaProgramacion: {
    idRuta: number | null;
    idVehiculo: number | null;
    idConductor: number | null;
    inicioProgramado: string;
    finProgramado?: string;
  } = {
    idRuta: null,
    idVehiculo: null,
    idConductor: null,
    inicioProgramado: '',
  };

  ngOnInit(): void {
    this.cargar();
    this.cargarOpciones();
  }

  cargar(): void {
    this.error.set('');
    this.cargando.set(true);
    this.service.listarTodas().subscribe({
      next: data => {
        this.programaciones.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudieron cargar las programaciones de rutas');
      },
    });
  }

  cargarOpciones(): void {
    this.service.listarRutas().subscribe({
      next: data => this.rutas.set(data.filter(r => r.activo !== false)),
      error: () => {},
    });
    this.service.listarVehiculos().subscribe({
      next: data => this.vehiculos.set(data.filter(v => v.activo !== false)),
      error: () => {},
    });
    this.service.listarConductores().subscribe({
      next: data => this.conductores.set(data.filter(c => c.activo !== false)),
      error: () => {},
    });
  }

  programacionesFiltradas(): ProgramacionRuta[] {
    const txt = this.filtroTexto().toLowerCase().trim();
    const est = this.filtroEstado();

    return this.programaciones().filter(p => {
      const matchTexto =
        !txt ||
        (p.nombreRuta || '').toLowerCase().includes(txt) ||
        (p.nombreZona || '').toLowerCase().includes(txt) ||
        (p.placaVehiculo || '').toLowerCase().includes(txt) ||
        (p.modeloVehiculo || '').toLowerCase().includes(txt) ||
        (p.nombreConductor || '').toLowerCase().includes(txt);

      const matchEstado =
        est === 'TODOS' ||
        (est === 'PROGRAMADA' && (p.idEstadoProgramacion === 1 || (p.estadoProgramacion || '').toUpperCase().includes('PROG'))) ||
        (est === 'EN_EJECUCION' && (p.idEstadoProgramacion === 2 || (p.estadoProgramacion || '').toUpperCase().includes('EJEC'))) ||
        (est === 'FINALIZADA' && (p.idEstadoProgramacion === 3 || (p.estadoProgramacion || '').toUpperCase().includes('FIN')));

      return matchTexto && matchEstado;
    });
  }

  // === MODAL RF-15: ASIGNAR PEDIDOS ===
  abrirModalAsignacion(ruta: ProgramacionRuta): void {
    this.rutaSeleccionada.set(ruta);
    this.pedidosSeleccionadosIds.clear();
    this.modalAsignacionAbierto.set(true);
    this.cargandoDisponibles.set(true);

    this.service.obtenerResumenCarga(ruta.idProgramacion).subscribe({
      next: data => this.resumenCarga.set(data),
      error: () => {},
    });

    this.service.listarPedidosDisponibles().subscribe({
      next: data => {
        this.pedidosDisponibles.set(data);
        this.cargandoDisponibles.set(false);
      },
      error: err => {
        this.cargandoDisponibles.set(false);
        this.mostrarError(err, 'No se pudieron cargar los pedidos disponibles');
      },
    });
  }

  cerrarModalAsignacion(): void {
    this.modalAsignacionAbierto.set(false);
    this.rutaSeleccionada.set(null);
    this.pedidosSeleccionadosIds.clear();
  }

  alternarSeleccionPedido(pedido: PedidoDisponibleAsignacion): void {
    if (this.pedidosSeleccionadosIds.has(pedido.idPedido)) {
      this.pedidosSeleccionadosIds.delete(pedido.idPedido);
    } else {
      this.pedidosSeleccionadosIds.add(pedido.idPedido);
    }
  }

  estaPedidoSeleccionado(idPedido: number): boolean {
    return this.pedidosSeleccionadosIds.has(idPedido);
  }

  todosSeleccionados(): boolean {
    return (
      this.pedidosDisponibles().length > 0 &&
      this.pedidosDisponibles().every(p => this.pedidosSeleccionadosIds.has(p.idPedido))
    );
  }

  alternarTodosLosPedidos(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      for (const p of this.pedidosDisponibles()) {
        this.pedidosSeleccionadosIds.add(p.idPedido);
      }
    } else {
      this.pedidosSeleccionadosIds.clear();
    }
  }

  pesoSeleccionado(): number {
    let total = 0;
    for (const p of this.pedidosDisponibles()) {
      if (this.pedidosSeleccionadosIds.has(p.idPedido)) {
        total += p.pesoTotalKg || 0;
      }
    }
    return total;
  }

  pesoTotalProyectado(): number {
    const pesoOcupado = this.resumenCarga()?.pesoOcupadoKg ?? this.rutaSeleccionada()?.pesoOcupadoKg ?? 0;
    return pesoOcupado + this.pesoSeleccionado();
  }

  excedeCapacidad(): boolean {
    const max = this.rutaSeleccionada()?.capacidadVehiculoKg || 0;
    return max > 0 && this.pesoTotalProyectado() > max;
  }

  obtenerPorcentajeProyectado(): number {
    const max = this.rutaSeleccionada()?.capacidadVehiculoKg || 1;
    const pct = (this.pesoTotalProyectado() / max) * 100;
    return Math.min(100, Math.max(0, pct));
  }

  autoSeleccionarPedidos(): void {
    const max = this.rutaSeleccionada()?.capacidadVehiculoKg || 0;
    const ocupado = this.resumenCarga()?.pesoOcupadoKg ?? 0;
    const disponible = Math.max(0, max - ocupado);

    this.pedidosSeleccionadosIds.clear();
    let acumulado = 0;

    for (const ped of this.pedidosDisponibles()) {
      const peso = ped.pesoTotalKg || 0;
      if (acumulado + peso <= disponible) {
        this.pedidosSeleccionadosIds.add(ped.idPedido);
        acumulado += peso;
      }
    }

    if (this.pedidosSeleccionadosIds.size === 0) {
      this.mostrarErrorTexto('Ningún pedido disponible cabe en la capacidad restante del vehículo.');
    } else {
      this.mostrarExito(
        `Se auto-seleccionaron ${this.pedidosSeleccionadosIds.size} pedido(s) aprovechando ${acumulado.toFixed(1)} kg de capacidad.`
      );
    }
  }

  confirmarAsignacion(): void {
    const ruta = this.rutaSeleccionada();
    if (!ruta || this.pedidosSeleccionadosIds.size === 0) return;

    this.guardandoAsignacion.set(true);
    const idPedidos = Array.from(this.pedidosSeleccionadosIds);

    this.service.asignarPedidos(ruta.idProgramacion, { idPedidos }).subscribe({
      next: res => {
        this.guardandoAsignacion.set(false);
        this.cerrarModalAsignacion();
        this.mostrarExito(res.mensaje || 'Pedidos asignados exitosamente a la ruta.');
        this.cargar();
      },
      error: err => {
        this.guardandoAsignacion.set(false);
        this.mostrarError(err, 'No se pudieron asignar los pedidos a la ruta');
      },
    });
  }

  // === AUTO-ASIGNACIÓN INTELIGENTE 1-CLICK DESDE LA TABLA ===
  ejecutarAutoAsignacion(p: ProgramacionRuta): void {
    this.procesandoAuto.set(p.idProgramacion);
    this.service.autoAsignarPedidos(p.idProgramacion).subscribe({
      next: res => {
        this.procesandoAuto.set(null);
        this.mostrarExito(res.mensaje);
        this.cargar();
      },
      error: err => {
        this.procesandoAuto.set(null);
        this.mostrarError(err, 'No se pudo auto-asignar pedidos a esta ruta');
      },
    });
  }

  // === CAMBIO DE ESTADO ===
  cambiarEstado(p: ProgramacionRuta, nuevoEstado: number): void {
    this.service.actualizarEstado(p.idProgramacion, nuevoEstado).subscribe({
      next: () => {
        this.mostrarExito(`Ruta #${p.idProgramacion} actualizada a ${nuevoEstado === 2 ? 'En Ejecución' : 'Finalizada'}.`);
        this.cargar();
      },
      error: err => this.mostrarError(err, 'No se pudo actualizar el estado de la programación'),
    });
  }

  // === MODAL NUEVA PROGRAMACIÓN ===
  abrirModalNuevaProgramacion(): void {
    this.nuevaProgramacion = {
      idRuta: null,
      idVehiculo: null,
      idConductor: null,
      inicioProgramado: '',
    };
    this.modalNuevaProgramacionAbierto.set(true);
  }

  cerrarModalNuevaProgramacion(): void {
    this.modalNuevaProgramacionAbierto.set(false);
  }

  guardarNuevaProgramacion(): void {
    if (!this.nuevaProgramacion.idRuta || !this.nuevaProgramacion.idVehiculo || !this.nuevaProgramacion.idConductor) {
      return;
    }

    this.guardandoProgramacion.set(true);
    const req: ProgramacionRutaRequest = {
      idRuta: this.nuevaProgramacion.idRuta,
      idVehiculo: this.nuevaProgramacion.idVehiculo,
      idConductor: this.nuevaProgramacion.idConductor,
      inicioProgramado: new Date(this.nuevaProgramacion.inicioProgramado).toISOString(),
      finProgramado: this.nuevaProgramacion.finProgramado
        ? new Date(this.nuevaProgramacion.finProgramado).toISOString()
        : undefined,
    };

    this.service.registrarAsignacion(req).subscribe({
      next: () => {
        this.guardandoProgramacion.set(false);
        this.cerrarModalNuevaProgramacion();
        this.mostrarExito('Programación de ruta registrada exitosamente.');
        this.cargar();
      },
      error: err => {
        this.guardandoProgramacion.set(false);
        this.mostrarError(err, 'No se pudo registrar la programación de ruta');
      },
    });
  }

  // === HELPERS VISUALES ===
  totalEnEjecucion(): number {
    return this.programaciones().filter(p => p.idEstadoProgramacion === 2 || (p.estadoProgramacion || '').toUpperCase().includes('EJEC')).length;
  }

  promedioCarga(): number {
    const items = this.programaciones();
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, p) => acc + (p.porcentajeOcupacion || 0), 0);
    return sum / items.length;
  }

  totalPedidosDespachados(): number {
    return this.programaciones().reduce((acc, p) => acc + (p.totalPedidos || 0), 0);
  }

  obtenerPorcentajeBarra(p: ProgramacionRuta): number {
    return Math.min(100, Math.max(0, p.porcentajeOcupacion || 0));
  }

  obtenerColorBarra(p: ProgramacionRuta): string {
    const pct = p.porcentajeOcupacion || 0;
    if (pct > 95) return 'bar-danger';
    if (pct > 80) return 'bar-warning';
    return '';
  }

  obtenerClaseEstado(estado?: string): string {
    const norm = (estado || '').toUpperCase();
    if (norm.includes('PROG')) return 'badge-programada';
    if (norm.includes('EJEC')) return 'badge-ejecucion';
    if (norm.includes('FIN')) return 'badge-finalizada';
    return 'badge-default';
  }

  private mostrarExito(msg: string): void {
    this.mensajeExito.set(msg);
    setTimeout(() => this.mensajeExito.set(''), 6000);
  }

  private mostrarErrorTexto(msg: string): void {
    this.error.set(msg);
    setTimeout(() => this.error.set(''), 6000);
  }

  private mostrarError(err: HttpErrorResponse, porDefecto: string): void {
    const detalle = err.error?.mensaje ?? err.error?.message ?? err.error?.error;
    this.error.set(detalle ? `${porDefecto}: ${detalle}` : `${porDefecto} (HTTP ${err.status})`);
    setTimeout(() => this.error.set(''), 8000);
  }
}
