import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { FleetService } from '../../services/fleet.service';
import {
  Vehiculo,
  VehiculoRequest,
  EstadoVehiculo,
  Conductor,
  ConductorRequest,
} from '../../models/fleet.model';

type ActiveTab = 'vehiculos' | 'conductores';

@Component({
  selector: 'app-fleet-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    DatePipe,
    PageHeaderComponent,
    IconComponent,
  ],
  template: `
    <app-page-header
      title="Gestión de Flota & Conductores"
      subtitle="Control integral de unidades de transporte (RF-18) y padrón oficial de choferes (RF-19)"
    >
      @if (activeTab() === 'vehiculos') {
        <button type="button" class="btn-primary" (click)="abrirModalVehiculo()">
          <app-icon name="plus" [size]="18"></app-icon>
          <span>Nuevo Vehículo</span>
        </button>
      } @else {
        <button type="button" class="btn-primary" (click)="abrirModalConductor()">
          <app-icon name="plus" [size]="18"></app-icon>
          <span>Nuevo Conductor</span>
        </button>
      }
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">
        <app-icon name="check-circle" [size]="18"></app-icon>
        <span>{{ mensaje() }}</span>
      </div>
    }

    @if (error()) {
      <div class="alert err">
        <app-icon name="alert" [size]="18"></app-icon>
        <span>{{ error() }}</span>
      </div>
    }

    <!-- Métricas y Estadísticas de Flota y Conductores -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon icon-truck">
          <app-icon name="truck" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ vehiculos().length }}</span>
          <span class="stat-label">Total Unidades</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-operativo">
          <app-icon name="check" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ vehiculosOperativos() }}</span>
          <span class="stat-label">Unidades Operativas</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-mantenimiento">
          <app-icon name="wrench" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ vehiculosEnMantenimiento() }}</span>
          <span class="stat-label">En Mantenimiento</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-conductores">
          <app-icon name="users" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ conductoresActivos() }} / {{ conductores().length }}</span>
          <span class="stat-label">Choferes Activos</span>
        </div>
      </div>
    </div>

    <!-- Navegación por Pestañas (Tabs) -->
    <div class="tabs-container">
      <button
        type="button"
        class="tab-btn"
        [class.active]="activeTab() === 'vehiculos'"
        (click)="cambiarTab('vehiculos')"
      >
        <app-icon name="truck" [size]="18"></app-icon>
        <span>Vehículos de Flota (RF-18)</span>
        <span class="tab-badge">{{ vehiculos().length }}</span>
      </button>

      <button
        type="button"
        class="tab-btn"
        [class.active]="activeTab() === 'conductores'"
        (click)="cambiarTab('conductores')"
      >
        <app-icon name="users" [size]="18"></app-icon>
        <span>Conductores y Choferes (RF-19)</span>
        <span class="tab-badge">{{ conductores().length }}</span>
      </button>
    </div>

    <!-- TAB 1: VEHÍCULOS (RF-18) -->
    @if (activeTab() === 'vehiculos') {
      <div class="content-card">
        <div class="card-toolbar">
          <div class="search-box">
            <app-icon name="search" [size]="18"></app-icon>
            <input
              type="text"
              placeholder="Buscar por placa, marca o modelo..."
              [(ngModel)]="busquedaVehiculo"
            />
          </div>

          <div class="filter-actions">
            <select [(ngModel)]="filtroEstadoVehiculo" class="filter-select">
              <option [ngValue]="null">Todos los estados</option>
              @for (est of estadosVehiculo(); track est.idEstadoVehiculo) {
                <option [ngValue]="est.idEstadoVehiculo">{{ est.nombre }}</option>
              }
            </select>

            <button type="button" class="btn-refresh" (click)="cargarVehiculos()" title="Recargar">
              <app-icon name="refresh" [size]="16"></app-icon>
            </button>
          </div>
        </div>

        @if (cargandoVehiculos()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando unidades vehiculares...</p>
          </div>
        } @else if (vehiculosFiltrados().length === 0) {
          <div class="empty-state">
            <app-icon name="truck" [size]="48"></app-icon>
            <h4>No se encontraron vehículos</h4>
            <p>No hay unidades que coincidan con los filtros o aún no se han registrado vehículos.</p>
            <button type="button" class="btn-primary" (click)="abrirModalVehiculo()">
              <app-icon name="plus" [size]="16"></app-icon>
              <span>Registrar Vehículo</span>
            </button>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Placa / Matrícula</th>
                  <th>Marca & Modelo</th>
                  <th>Capacidad de Carga</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (v of vehiculosFiltrados(); track v.idVehiculo) {
                  <tr>
                    <td class="col-id">#{{ v.idVehiculo }}</td>
                    <td>
                      <span class="plate-badge">{{ v.placa }}</span>
                    </td>
                    <td>
                      <div class="vehicle-info">
                        <strong>{{ v.marca || 'Sin marca' }}</strong>
                        <span class="sub-text">{{ v.modelo || 'Sin modelo' }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="capacity-info">
                        <strong>{{ v.capacidadKg | number:'1.0-0' }} kg</strong>
                        <span class="sub-text">({{ (v.capacidadKg / 1000) | number:'1.1-2' }} Ton)</span>
                      </div>
                    </td>
                    <td>
                      <span [class]="'badge-status status-' + sanitizarEstado(v.nombreEstado)">
                        {{ v.nombreEstado }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="action-buttons">
                        <button
                          type="button"
                          class="btn-action edit"
                          (click)="editarVehiculo(v)"
                          title="Editar Vehículo"
                        >
                          <app-icon name="edit" [size]="16"></app-icon>
                        </button>
                        <button
                          type="button"
                          class="btn-action delete"
                          (click)="confirmarEliminarVehiculo(v)"
                          title="Eliminar Vehículo"
                        >
                          <app-icon name="trash" [size]="16"></app-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }

    <!-- TAB 2: CONDUCTORES (RF-19) -->
    @if (activeTab() === 'conductores') {
      <div class="content-card">
        <div class="card-toolbar">
          <div class="search-box">
            <app-icon name="search" [size]="18"></app-icon>
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o N° de licencia..."
              [(ngModel)]="busquedaConductor"
            />
          </div>

          <div class="filter-actions">
            <select [(ngModel)]="filtroEstadoConductor" class="filter-select">
              <option value="todos">Todos los conductores</option>
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo inactivos</option>
              <option value="vencidos">Licencia vencida</option>
            </select>

            <button type="button" class="btn-refresh" (click)="cargarConductores()" title="Recargar">
              <app-icon name="refresh" [size]="16"></app-icon>
            </button>
          </div>
        </div>

        @if (cargandoConductores()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando padrón de conductores...</p>
          </div>
        } @else if (conductoresFiltrados().length === 0) {
          <div class="empty-state">
            <app-icon name="users" [size]="48"></app-icon>
            <h4>No se encontraron conductores</h4>
            <p>No hay conductores registrados con los filtros seleccionados.</p>
            <button type="button" class="btn-primary" (click)="abrirModalConductor()">
              <app-icon name="plus" [size]="16"></app-icon>
              <span>Registrar Conductor</span>
            </button>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Conductor</th>
                  <th>DNI</th>
                  <th>Licencia de Conducir</th>
                  <th>Vencimiento Licencia</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (c of conductoresFiltrados(); track c.idConductor) {
                  <tr>
                    <td class="col-id">#{{ c.idConductor }}</td>
                    <td>
                      <div class="driver-cell">
                        <div class="driver-avatar">
                          {{ obtenerIniciales(c.nombres, c.apellidos) }}
                        </div>
                        <div class="driver-info">
                          <strong>{{ c.nombres }} {{ c.apellidos }}</strong>
                          @if (c.idUsuario) {
                            <span class="user-link-badge">Usuario del Sistema</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="dni-text">{{ c.dni }}</span>
                    </td>
                    <td>
                      <div class="license-info">
                        <strong>{{ c.nroLicencia }}</strong>
                        <span class="category-pill">{{ c.categoriaLicencia }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="license-status">
                        <span>{{ c.fechaVencLicencia | date:'dd/MM/yyyy' }}</span>
                        @if (c.licenciaVencida) {
                          <span class="badge-status status-vencida">Vencida</span>
                        } @else {
                          <span class="badge-status status-vigente">Vigente</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="phone-text">{{ c.telefono || '-' }}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="status-toggle-btn"
                        [class.active]="c.activo"
                        (click)="alternarEstadoConductor(c)"
                        [title]="c.activo ? 'Clic para desactivar' : 'Clic para activar'"
                      >
                        <span class="toggle-indicator"></span>
                        <span>{{ c.activo ? 'Activo' : 'Inactivo' }}</span>
                      </button>
                    </td>
                    <td class="text-right">
                      <div class="action-buttons">
                        <button
                          type="button"
                          class="btn-action edit"
                          (click)="editarConductor(c)"
                          title="Editar Conductor"
                        >
                          <app-icon name="edit" [size]="16"></app-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }

    <!-- MODAL: REGISTRAR / EDITAR VEHÍCULO (RF-18) -->
    @if (modalVehiculoAbierto()) {
      <div class="modal-backdrop" (click)="cerrarModalVehiculo()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ vehiculoEnEdicion() ? 'Editar Vehículo #' + vehiculoEnEdicion()?.idVehiculo : 'Registrar Nuevo Vehículo' }}</h3>
            <button type="button" class="btn-close" (click)="cerrarModalVehiculo()">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (ngSubmit)="guardarVehiculo()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Placa de Rodaje *</label>
                <input
                  type="text"
                  name="placa"
                  placeholder="Ej. ABC-123"
                  [(ngModel)]="formVehiculo.placa"
                  maxlength="20"
                  required
                  style="text-transform: uppercase;"
                />
              </div>

              <div class="form-group">
                <label>Estado Inicial *</label>
                <select
                  name="idEstadoVehiculo"
                  [(ngModel)]="formVehiculo.idEstadoVehiculo"
                  required
                >
                  @for (est of estadosVehiculo(); track est.idEstadoVehiculo) {
                    <option [ngValue]="est.idEstadoVehiculo">{{ est.nombre }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  name="marca"
                  placeholder="Ej. Volvo, Isuzu, Hyundai"
                  [(ngModel)]="formVehiculo.marca"
                  maxlength="50"
                />
              </div>

              <div class="form-group">
                <label>Modelo</label>
                <input
                  type="text"
                  name="modelo"
                  placeholder="Ej. VM 270, Canter 5T"
                  [(ngModel)]="formVehiculo.modelo"
                  maxlength="50"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Capacidad de Carga Útil (kg) *</label>
              <input
                type="number"
                name="capacidadKg"
                placeholder="Ej. 12000"
                [(ngModel)]="formVehiculo.capacidadKg"
                min="1"
                step="any"
                required
              />
              @if (formVehiculo.capacidadKg) {
                <small class="form-hint">
                  Equivalente aproximado: {{ (formVehiculo.capacidadKg / 1000) | number:'1.1-2' }} Toneladas
                </small>
              }
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="cerrarModalVehiculo()">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary"
                [disabled]="guardandoVehiculo() || !formVehiculo.placa || !formVehiculo.capacidadKg"
              >
                {{ guardandoVehiculo() ? 'Guardando...' : (vehiculoEnEdicion() ? 'Actualizar Vehículo' : 'Guardar Vehículo') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- MODAL: REGISTRAR / EDITAR CONDUCTOR (RF-19) -->
    @if (modalConductorAbierto()) {
      <div class="modal-backdrop" (click)="cerrarModalConductor()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ conductorEnEdicion() ? 'Editar Conductor #' + conductorEnEdicion()?.idConductor : 'Registrar Nuevo Conductor' }}</h3>
            <button type="button" class="btn-close" (click)="cerrarModalConductor()">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <form (ngSubmit)="guardarConductor()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Nombres *</label>
                <input
                  type="text"
                  name="nombres"
                  placeholder="Ej. Carlos"
                  [(ngModel)]="formConductor.nombres"
                  maxlength="100"
                  required
                />
              </div>

              <div class="form-group">
                <label>Apellidos *</label>
                <input
                  type="text"
                  name="apellidos"
                  placeholder="Ej. Mendoza Soto"
                  [(ngModel)]="formConductor.apellidos"
                  maxlength="100"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>DNI * (8 dígitos)</label>
                <input
                  type="text"
                  name="dni"
                  placeholder="45892134"
                  [(ngModel)]="formConductor.dni"
                  maxlength="8"
                  pattern="[0-9]{8}"
                  required
                />
              </div>

              <div class="form-group">
                <label>Teléfono de Contacto</label>
                <input
                  type="text"
                  name="telefono"
                  placeholder="987112233"
                  [(ngModel)]="formConductor.telefono"
                  maxlength="15"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>N° de Licencia de Conducir *</label>
                <input
                  type="text"
                  name="nroLicencia"
                  placeholder="Ej. Q45892134"
                  [(ngModel)]="formConductor.nroLicencia"
                  maxlength="20"
                  required
                  style="text-transform: uppercase;"
                />
              </div>

              <div class="form-group">
                <label>Categoría de Licencia *</label>
                <select
                  name="categoriaLicencia"
                  [(ngModel)]="formConductor.categoriaLicencia"
                  required
                >
                  <option value="A-I">A-I (Particular)</option>
                  <option value="A-IIa">A-IIa (Taxis / Remises)</option>
                  <option value="A-IIb">A-IIb (Furgones / Microbús)</option>
                  <option value="A-IIIa">A-IIIa (Ómnibus de pasajeros)</option>
                  <option value="A-IIIb">A-IIIb (Camiones pesados / Volquetes)</option>
                  <option value="A-IIIc">A-IIIc (Profesional Especial / Tráiler)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Fecha de Vencimiento de Licencia *</label>
              <input
                type="date"
                name="fechaVencLicencia"
                [(ngModel)]="formConductor.fechaVencLicencia"
                required
              />
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  name="activo"
                  [(ngModel)]="formConductor.activo"
                />
                <span>Conductor habilitado y disponible para asignaciones</span>
              </label>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="cerrarModalConductor()">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary"
                [disabled]="guardandoConductor() || !formConductor.nombres || !formConductor.apellidos || !formConductor.dni || !formConductor.nroLicencia || !formConductor.fechaVencLicencia"
              >
                {{ guardandoConductor() ? 'Guardando...' : (conductorEnEdicion() ? 'Actualizar Conductor' : 'Guardar Conductor') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- MODAL: CONFIRMACIÓN ELIMINAR VEHÍCULO -->
    @if (vehiculoAEliminar()) {
      <div class="modal-backdrop" (click)="cancelarEliminarVehiculo()">
        <div class="modal-box modal-confirm" (click)="$event.stopPropagation()">
          <div class="confirm-icon">
            <app-icon name="alert" [size]="32"></app-icon>
          </div>
          <h3>Confirmar Eliminación</h3>
          <p>
            ¿Está seguro que desea eliminar la unidad vehicular con placa
            <strong>{{ vehiculoAEliminar()?.placa }}</strong>?
          </p>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="cancelarEliminarVehiculo()">
              Cancelar
            </button>
            <button type="button" class="btn-danger" (click)="ejecutarEliminarVehiculo()">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      color: #1e293b;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .alert.ok {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }
    .alert.err {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    /* Estadísticas Rápidas */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-truck {
      background: #eff6ff;
      color: #2563eb;
    }
    .icon-operativo {
      background: #f0fdf4;
      color: #16a34a;
    }
    .icon-mantenimiento {
      background: #fffbeb;
      color: #d97706;
    }
    .icon-conductores {
      background: #f5f3ff;
      color: #7c3aed;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
    }
    .stat-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Tabs */
    .tabs-container {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 1.5rem;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1.25rem;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      font-size: 0.95rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: -2px;
    }
    .tab-btn:hover {
      color: #0f172a;
    }
    .tab-btn.active {
      color: #10b981;
      border-bottom-color: #10b981;
    }
    .tab-badge {
      background: #f1f5f9;
      color: #475569;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      font-weight: 700;
    }
    .tab-btn.active .tab-badge {
      background: #d1fae5;
      color: #065f46;
    }

    /* Contenido de Tarjeta */
    .content-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      padding: 1.5rem;
    }

    .card-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.5rem 0.85rem;
      width: 100%;
      max-width: 380px;
    }
    .search-box input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 0.875rem;
      color: #1e293b;
    }

    .filter-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .filter-select {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: white;
      font-size: 0.875rem;
      color: #1e293b;
      outline: none;
      cursor: pointer;
    }
    .btn-refresh {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      transition: background 0.2s;
    }
    .btn-refresh:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    /* Tablas */
    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      padding: 0.85rem 1rem;
      background: #f8fafc;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
      vertical-align: middle;
    }
    .data-table tbody tr:hover {
      background: #fafafa;
    }

    .col-id {
      color: #94a3b8;
      font-weight: 600;
      font-size: 0.8rem;
      width: 60px;
    }

    .plate-badge {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      background: #0f172a;
      color: #38bdf8;
      font-family: monospace;
      font-weight: 700;
      font-size: 0.9rem;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }

    .vehicle-info, .capacity-info, .license-info, .license-status {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .sub-text {
      font-size: 0.775rem;
      color: #64748b;
    }

    /* Badges de Estado */
    .badge-status {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-operativo, .status-disponible, .status-vigente {
      background: #dcfce7;
      color: #15803d;
    }
    .status-en-ruta {
      background: #e0f2fe;
      color: #0369a1;
    }
    .status-en-mantenimiento {
      background: #fef3c7;
      color: #b45309;
    }
    .status-fuera-de-servicio, .status-vencida {
      background: #fee2e2;
      color: #b91c1c;
    }

    /* Celdas Conductor */
    .driver-cell {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .driver-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 700;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .driver-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .user-link-badge {
      font-size: 0.7rem;
      color: #6366f1;
      font-weight: 500;
    }

    .category-pill {
      display: inline-block;
      width: fit-content;
      padding: 0.1rem 0.45rem;
      background: #f1f5f9;
      color: #334155;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .dni-text, .phone-text {
      font-family: monospace;
      font-size: 0.875rem;
      color: #334155;
    }

    /* Botón Toggle de Estado Activo */
    .status-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .status-toggle-btn .toggle-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
    }
    .status-toggle-btn.active {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
    }
    .status-toggle-btn.active .toggle-indicator {
      background: #10b981;
    }

    /* Acciones */
    .action-buttons {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-action {
      background: none;
      border: none;
      padding: 0.4rem;
      border-radius: 6px;
      cursor: pointer;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .btn-action.edit:hover {
      background: #f1f5f9;
      color: #0284c7;
    }
    .btn-action.delete:hover {
      background: #fef2f2;
      color: #dc2626;
    }
    .text-right {
      text-align: right;
    }

    /* Botones primarios y secundarios */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #18d600;
      color: #091a05;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) {
      background: #15b800;
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .btn-danger {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #ef4444;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }
    .btn-danger:hover {
      background: #dc2626;
    }

    /* Estados de Carga y Vacío */
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
      color: #64748b;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #18d600;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .empty-state h4 {
      margin: 1rem 0 0.5rem;
      font-size: 1.1rem;
      color: #1e293b;
    }
    .empty-state p {
      margin-bottom: 1.25rem;
      max-width: 400px;
      font-size: 0.875rem;
    }

    /* Modales */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-box {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 540px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      animation: modalFadeIn 0.2s ease-out;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #0f172a;
    }
    .btn-close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      padding: 0.25rem;
      border-radius: 4px;
    }
    .btn-close:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    .modal-form {
      padding: 1.5rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1.15rem;
    }
    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
    }
    .form-group input, .form-group select {
      padding: 0.6rem 0.85rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 0.875rem;
      color: #1e293b;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-group input:focus, .form-group select:focus {
      border-color: #18d600;
      box-shadow: 0 0 0 3px rgba(24, 214, 0, 0.15);
    }
    .form-hint {
      font-size: 0.75rem;
      color: #64748b;
    }
    .checkbox-group {
      margin-top: 0.5rem;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: #334155;
    }
    .checkbox-label input {
      width: 16px;
      height: 16px;
      accent-color: #18d600;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid #f1f5f9;
    }

    /* Modal Confirm */
    .modal-confirm {
      max-width: 420px;
      padding: 1.5rem;
      text-align: center;
    }
    .confirm-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #fef2f2;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }
    .modal-confirm h3 {
      margin: 0 0 0.5rem;
      font-size: 1.15rem;
    }
    .modal-confirm p {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0 0 1.5rem;
    }
    .modal-confirm .modal-footer {
      justify-content: center;
      margin: 0;
      padding: 0;
      border: none;
    }
  `]
})
export class FleetListPageComponent implements OnInit {
  private fleetService = inject(FleetService);

  // Pestaña activa
  activeTab = signal<ActiveTab>('vehiculos');

  // Notificaciones
  mensaje = signal<string | null>(null);
  error = signal<string | null>(null);

  // Estados Vehículos
  vehiculos = signal<Vehiculo[]>([]);
  estadosVehiculo = signal<EstadoVehiculo[]>([]);
  cargandoVehiculos = signal<boolean>(false);
  busquedaVehiculo = '';
  filtroEstadoVehiculo: number | null = null;

  // Modal Vehículo
  modalVehiculoAbierto = signal<boolean>(false);
  vehiculoEnEdicion = signal<Vehiculo | null>(null);
  guardandoVehiculo = signal<boolean>(false);
  vehiculoAEliminar = signal<Vehiculo | null>(null);

  formVehiculo: VehiculoRequest = {
    placa: '',
    marca: '',
    modelo: '',
    capacidadKg: 5000,
    idEstadoVehiculo: 1,
  };

  // Estados Conductores
  conductores = signal<Conductor[]>([]);
  cargandoConductores = signal<boolean>(false);
  busquedaConductor = '';
  filtroEstadoConductor: 'todos' | 'activos' | 'inactivos' | 'vencidos' = 'todos';

  // Modal Conductor
  modalConductorAbierto = signal<boolean>(false);
  conductorEnEdicion = signal<Conductor | null>(null);
  guardandoConductor = signal<boolean>(false);

  formConductor: ConductorRequest = {
    nombres: '',
    apellidos: '',
    dni: '',
    nroLicencia: '',
    categoriaLicencia: 'A-IIIc',
    fechaVencLicencia: '',
    telefono: '',
    activo: true,
  };

  // Computados para KPIs
  vehiculosOperativos = computed(() =>
    this.vehiculos().filter((v) => v.nombreEstado?.toLowerCase().includes('operativo') || v.idEstadoVehiculo === 1).length
  );

  vehiculosEnMantenimiento = computed(() =>
    this.vehiculos().filter((v) => v.nombreEstado?.toLowerCase().includes('mantenimiento') || v.idEstadoVehiculo === 3).length
  );

  conductoresActivos = computed(() =>
    this.conductores().filter((c) => c.activo).length
  );

  // Filtros en memoria para Vehículos
  vehiculosFiltrados = computed(() => {
    let list = this.vehiculos();
    if (this.filtroEstadoVehiculo !== null) {
      list = list.filter((v) => v.idEstadoVehiculo === this.filtroEstadoVehiculo);
    }
    const q = this.busquedaVehiculo.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (v) =>
          v.placa.toLowerCase().includes(q) ||
          (v.marca && v.marca.toLowerCase().includes(q)) ||
          (v.modelo && v.modelo.toLowerCase().includes(q))
      );
    }
    return list;
  });

  // Filtros en memoria para Conductores
  conductoresFiltrados = computed(() => {
    let list = this.conductores();
    if (this.filtroEstadoConductor === 'activos') {
      list = list.filter((c) => c.activo);
    } else if (this.filtroEstadoConductor === 'inactivos') {
      list = list.filter((c) => !c.activo);
    } else if (this.filtroEstadoConductor === 'vencidos') {
      list = list.filter((c) => c.licenciaVencida);
    }

    const q = this.busquedaConductor.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.nombres.toLowerCase().includes(q) ||
          c.apellidos.toLowerCase().includes(q) ||
          c.dni.toLowerCase().includes(q) ||
          c.nroLicencia.toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.cargarEstadosVehiculo();
    this.cargarVehiculos();
    this.cargarConductores();
  }

  cambiarTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    this.limpiarMensajes();
  }

  // === MÉTODOS VEHÍCULOS (RF-18) ===
  cargarEstadosVehiculo(): void {
    this.fleetService.listarEstadosVehiculo().subscribe({
      next: (estados) => this.estadosVehiculo.set(estados),
      error: (err) => console.error('Error al cargar estados de vehículo:', err),
    });
  }

  cargarVehiculos(): void {
    this.cargandoVehiculos.set(true);
    this.fleetService.listarVehiculos().subscribe({
      next: (data) => {
        this.vehiculos.set(data);
        this.cargandoVehiculos.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoVehiculos.set(false);
        this.mostrarError('No se pudieron cargar los vehículos de flota.');
      },
    });
  }

  abrirModalVehiculo(): void {
    this.vehiculoEnEdicion.set(null);
    this.formVehiculo = {
      placa: '',
      marca: '',
      modelo: '',
      capacidadKg: 5000,
      idEstadoVehiculo: this.estadosVehiculo().length > 0 ? this.estadosVehiculo()[0].idEstadoVehiculo : 1,
    };
    this.modalVehiculoAbierto.set(true);
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    this.vehiculoEnEdicion.set(vehiculo);
    this.formVehiculo = {
      placa: vehiculo.placa,
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo || '',
      capacidadKg: vehiculo.capacidadKg,
      idEstadoVehiculo: vehiculo.idEstadoVehiculo,
    };
    this.modalVehiculoAbierto.set(true);
  }

  cerrarModalVehiculo(): void {
    this.modalVehiculoAbierto.set(false);
    this.vehiculoEnEdicion.set(null);
  }

  guardarVehiculo(): void {
    if (!this.formVehiculo.placa || !this.formVehiculo.capacidadKg) return;

    this.guardandoVehiculo.set(true);
    this.formVehiculo.placa = this.formVehiculo.placa.trim().toUpperCase();

    const actual = this.vehiculoEnEdicion();
    if (actual) {
      this.fleetService.actualizarVehiculo(actual.idVehiculo, this.formVehiculo).subscribe({
        next: (updated) => {
          this.guardandoVehiculo.set(false);
          this.cerrarModalVehiculo();
          this.mostrarMensaje(`Vehículo ${updated.placa} actualizado exitosamente.`);
          this.cargarVehiculos();
        },
        error: (err: HttpErrorResponse) => {
          this.guardandoVehiculo.set(false);
          const msg = err.error?.message || 'Error al actualizar el vehículo.';
          this.mostrarError(msg);
        },
      });
    } else {
      this.fleetService.crearVehiculo(this.formVehiculo).subscribe({
        next: (created) => {
          this.guardandoVehiculo.set(false);
          this.cerrarModalVehiculo();
          this.mostrarMensaje(`Vehículo ${created.placa} registrado exitosamente.`);
          this.cargarVehiculos();
        },
        error: (err: HttpErrorResponse) => {
          this.guardandoVehiculo.set(false);
          const msg = err.error?.message || 'Error al registrar el vehículo.';
          this.mostrarError(msg);
        },
      });
    }
  }

  confirmarEliminarVehiculo(vehiculo: Vehiculo): void {
    this.vehiculoAEliminar.set(vehiculo);
  }

  cancelarEliminarVehiculo(): void {
    this.vehiculoAEliminar.set(null);
  }

  ejecutarEliminarVehiculo(): void {
    const v = this.vehiculoAEliminar();
    if (!v) return;

    this.fleetService.eliminarVehiculo(v.idVehiculo).subscribe({
      next: () => {
        this.vehiculoAEliminar.set(null);
        this.mostrarMensaje(`Vehículo ${v.placa} eliminado exitosamente.`);
        this.cargarVehiculos();
      },
      error: (err: HttpErrorResponse) => {
        this.vehiculoAEliminar.set(null);
        const msg = err.error?.message || 'No se pudo eliminar el vehículo porque tiene mantenimientos o rutas asignadas.';
        this.mostrarError(msg);
      },
    });
  }

  // === MÉTODOS CONDUCTORES (RF-19) ===
  cargarConductores(): void {
    this.cargandoConductores.set(true);
    this.fleetService.listarConductores().subscribe({
      next: (data) => {
        this.conductores.set(data);
        this.cargandoConductores.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoConductores.set(false);
        this.mostrarError('No se pudo cargar el padrón de conductores.');
      },
    });
  }

  abrirModalConductor(): void {
    this.conductorEnEdicion.set(null);
    this.formConductor = {
      nombres: '',
      apellidos: '',
      dni: '',
      nroLicencia: '',
      categoriaLicencia: 'A-IIIc',
      fechaVencLicencia: '',
      telefono: '',
      activo: true,
    };
    this.modalConductorAbierto.set(true);
  }

  editarConductor(conductor: Conductor): void {
    this.conductorEnEdicion.set(conductor);
    this.formConductor = {
      idUsuario: conductor.idUsuario,
      nombres: conductor.nombres,
      apellidos: conductor.apellidos,
      dni: conductor.dni,
      nroLicencia: conductor.nroLicencia,
      categoriaLicencia: conductor.categoriaLicencia,
      fechaVencLicencia: conductor.fechaVencLicencia,
      telefono: conductor.telefono || '',
      activo: conductor.activo,
    };
    this.modalConductorAbierto.set(true);
  }

  cerrarModalConductor(): void {
    this.modalConductorAbierto.set(false);
    this.conductorEnEdicion.set(null);
  }

  guardarConductor(): void {
    if (
      !this.formConductor.nombres ||
      !this.formConductor.apellidos ||
      !this.formConductor.dni ||
      !this.formConductor.nroLicencia ||
      !this.formConductor.fechaVencLicencia
    ) {
      return;
    }

    this.guardandoConductor.set(true);
    this.formConductor.nroLicencia = this.formConductor.nroLicencia.trim().toUpperCase();

    const actual = this.conductorEnEdicion();
    if (actual) {
      this.fleetService.actualizarConductor(actual.idConductor, this.formConductor).subscribe({
        next: (updated) => {
          this.guardandoConductor.set(false);
          this.cerrarModalConductor();
          this.mostrarMensaje(`Conductor ${updated.nombres} ${updated.apellidos} actualizado.`);
          this.cargarConductores();
        },
        error: (err: HttpErrorResponse) => {
          this.guardandoConductor.set(false);
          const msg = err.error?.message || 'Error al actualizar los datos del conductor.';
          this.mostrarError(msg);
        },
      });
    } else {
      this.fleetService.crearConductor(this.formConductor).subscribe({
        next: (created) => {
          this.guardandoConductor.set(false);
          this.cerrarModalConductor();
          this.mostrarMensaje(`Conductor ${created.nombres} ${created.apellidos} registrado exitosamente.`);
          this.cargarConductores();
        },
        error: (err: HttpErrorResponse) => {
          this.guardandoConductor.set(false);
          const msg = err.error?.message || 'Error al registrar al nuevo conductor.';
          this.mostrarError(msg);
        },
      });
    }
  }

  alternarEstadoConductor(conductor: Conductor): void {
    const nuevoEstado = !conductor.activo;
    this.fleetService.cambiarEstadoConductor(conductor.idConductor, nuevoEstado).subscribe({
      next: () => {
        conductor.activo = nuevoEstado;
        this.mostrarMensaje(
          `Conductor ${conductor.nombres} ${conductor.apellidos} ${nuevoEstado ? 'activado' : 'desactivado'}.`
        );
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'No se pudo cambiar el estado del conductor.';
        this.mostrarError(msg);
      },
    });
  }

  // Helpers
  sanitizarEstado(estado?: string): string {
    if (!estado) return 'default';
    return estado
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }

  obtenerIniciales(nombres: string, apellidos: string): string {
    const n = nombres ? nombres.trim().charAt(0) : '';
    const a = apellidos ? apellidos.trim().charAt(0) : '';
    return (n + a).toUpperCase() || 'CH';
  }

  mostrarMensaje(msg: string): void {
    this.error.set(null);
    this.mensaje.set(msg);
    setTimeout(() => this.mensaje.set(null), 4000);
  }

  mostrarError(err: string): void {
    this.mensaje.set(null);
    this.error.set(err);
    setTimeout(() => this.error.set(null), 6000);
  }

  limpiarMensajes(): void {
    this.mensaje.set(null);
    this.error.set(null);
  }
}
