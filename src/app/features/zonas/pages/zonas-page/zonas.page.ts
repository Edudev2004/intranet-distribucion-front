import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ZonasService } from '../../zonas.service';
import { ZonaRequestDTO, ZonaResponseDTO } from '../../zona.model';

interface ZonaFormData {
  idZona?: number;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-zonas-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent],
  template: `
    <app-page-header
      title="Zonas de Reparto"
      subtitle="Definición y administración de zonas geográficas de distribución (RF-13)"
    >
      <button type="button" class="btn-primary" (click)="abrirModalNuevo()">
        <app-icon name="plus" [size]="16"></app-icon>
        <span>Nueva Zona</span>
      </button>
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

    <!-- KPIs de Zonas -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon icon-total">
          <app-icon name="map-pin" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalZonas() }}</span>
          <span class="stat-label">Total Zonas Registradas</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-active">
          <app-icon name="check-circle" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ zonasConDescripcion() }}</span>
          <span class="stat-label">Zonas con Alcance Detallado</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-coverage">
          <app-icon name="truck" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">100%</span>
          <span class="stat-label">Cobertura Operativa</span>
        </div>
      </div>
    </div>

    <!-- Barra de Búsqueda y Filtros -->
    <div class="content-card filters-bar">
      <div class="search-input-wrapper">
        <app-icon name="search" [size]="16" class="search-icon"></app-icon>
        <input
          type="text"
          placeholder="Buscar zona por nombre o cobertura territorial..."
          [(ngModel)]="busquedaTexto"
          class="filter-input"
        />
      </div>
      <button type="button" class="btn-ghost" (click)="recargarZonas()" title="Actualizar lista">
        <app-icon name="refresh" [size]="14"></app-icon>
        <span>Actualizar</span>
      </button>
    </div>

    <!-- Directorio de Zonas -->
    <div class="content-card table-section">
      <div class="table-header">
        <div>
          <h3>Sectores Geográficos de Distribución</h3>
          <p>Zonas operativas asignadas para organización de rutas y clientes</p>
        </div>
        <div class="table-meta">
          <span>Mostrando {{ zonasFiltradas().length }} de {{ totalZonas() }} zonas</span>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando zonas de reparto...</p>
        </div>
      } @else if (zonasFiltradas().length === 0) {
        <div class="empty-state">
          <app-icon name="map-pin" [size]="48" class="empty-icon"></app-icon>
          <h4>No se encontraron zonas de reparto</h4>
          <p>No existen registros coincidentes con el término de búsqueda o aún no se han configurado zonas.</p>
          <button type="button" class="btn-primary mt-3" (click)="abrirModalNuevo()">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Crear primera zona</span>
          </button>
        </div>
      } @else {
        <div class="zonas-grid">
          @for (z of zonasFiltradas(); track z.idZona) {
            <div class="zona-card">
              <div class="zona-card-header">
                <div class="zona-badge">
                  <app-icon name="map-pin" [size]="16"></app-icon>
                  <span>Zona #{{ z.idZona }}</span>
                </div>
                <div class="zona-actions">
                  <button
                    type="button"
                    class="action-btn btn-edit"
                    title="Editar zona"
                    (click)="abrirModalEditar(z)"
                  >
                    <app-icon name="edit" [size]="14"></app-icon>
                  </button>
                  <button
                    type="button"
                    class="action-btn btn-delete"
                    title="Eliminar zona"
                    (click)="abrirModalEliminar(z)"
                  >
                    <app-icon name="trash" [size]="14"></app-icon>
                  </button>
                </div>
              </div>

              <div class="zona-card-body">
                <h4 class="zona-nombre">{{ z.nombre }}</h4>
                <p class="zona-desc">
                  {{ z.descripcion || 'Sin descripción territorial detallada.' }}
                </p>
              </div>

              <div class="zona-card-footer">
                <span class="zona-status">
                  <span class="status-dot"></span>
                  Área Operativa Habilitada
                </span>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal Formulario: Crear / Editar Zona -->
    @if (mostrarModalForm()) {
      <div class="modal-backdrop" (click)="cerrarModalForm()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="modal-header-icon">
                <app-icon [name]="esEdicion() ? 'edit' : 'plus'" [size]="18"></app-icon>
              </div>
              <div>
                <h3>{{ esEdicion() ? 'Editar Zona de Reparto' : 'Nueva Zona de Reparto' }}</h3>
                <p>{{ esEdicion() ? 'Actualice la información y delimitación de la zona' : 'Registre una nueva zona geográfica para asignación de rutas' }}</p>
              </div>
            </div>
            <button type="button" class="btn-close" (click)="cerrarModalForm()">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          @if (formError()) {
            <div class="modal-alert err">
              <app-icon name="alert" [size]="16"></app-icon>
              <span>{{ formError() }}</span>
            </div>
          }

          <form (ngSubmit)="guardarZona()" class="modal-body">
            <div class="form-group">
              <label>Nombre de la Zona <span class="required">*</span></label>
              <input
                type="text"
                [(ngModel)]="formZona.nombre"
                name="nombre"
                required
                maxlength="100"
                placeholder="Ej. Lima Norte, Cono Sur, Callao Central"
                class="form-control"
              />
              <span class="input-hint">Nombre único identificativo de la zona de cobertura.</span>
            </div>

            <div class="form-group">
              <label>Descripción / Alcance Territorial</label>
              <textarea
                [(ngModel)]="formZona.descripcion"
                name="descripcion"
                rows="3"
                maxlength="255"
                placeholder="Ej. Distritos comprendidos: Comas, Los Olivos, Independencia, San Martín de Porres"
                class="form-control"
              ></textarea>
              <span class="input-hint">Detalle de distritos o sectores que componen esta zona.</span>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-ghost" (click)="cerrarModalForm()" [disabled]="guardando()">
                Cancelar
              </button>
              <button type="submit" class="btn-primary" [disabled]="guardando()">
                @if (guardando()) {
                  <span class="spinner-small"></span>
                  <span>Guardando...</span>
                } @else {
                  <app-icon [name]="esEdicion() ? 'check' : 'plus'" [size]="16"></app-icon>
                  <span>{{ esEdicion() ? 'Actualizar Zona' : 'Guardar Zona' }}</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal Confirmar Eliminación -->
    @if (zonaEliminar()) {
      <div class="modal-backdrop" (click)="cancelarEliminar()">
        <div class="modal-content modal-confirm" (click)="$event.stopPropagation()">
          <div class="modal-confirm-icon icon-danger">
            <app-icon name="trash" [size]="28"></app-icon>
          </div>
          <h3>¿Eliminar zona de reparto?</h3>
          <p class="confirm-text">
            Se eliminará la zona <strong>{{ zonaEliminar()?.nombre }}</strong>.
          </p>
          <p class="confirm-subtext">
            Esta acción no se puede deshacer. Si la zona tiene rutas o clientes asignados, el sistema no permitirá su eliminación.
          </p>
          <div class="modal-footer justify-center">
            <button type="button" class="btn-ghost" (click)="cancelarEliminar()">Cancelar</button>
            <button
              type="button"
              class="btn-danger"
              (click)="confirmarEliminar()"
              [disabled]="guardando()"
            >
              Eliminar Registro
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      padding: 1.5rem 2rem;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* Alertas */
    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      font-size: 13.5px;
      font-weight: 500;
    }
    .alert.ok {
      background: rgba(24, 214, 0, 0.1);
      border: 1px solid rgba(24, 214, 0, 0.3);
      color: #065f46;
    }
    .alert.err {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    /* KPIs */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .stat-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
    }
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-total {
      background: rgba(24, 214, 0, 0.15);
      color: #15803d;
    }
    .icon-active {
      background: rgba(59, 130, 246, 0.12);
      color: #2563eb;
    }
    .icon-coverage {
      background: rgba(15, 23, 42, 0.06);
      color: #0f172a;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    /* Tarjetas de Contenido */
    .content-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      margin-bottom: 1.5rem;
    }

    /* Barra de Búsqueda */
    .filters-bar {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .search-input-wrapper {
      position: relative;
      flex: 1;
      max-width: 420px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      pointer-events: none;
    }
    .filter-input {
      width: 100%;
      padding: 8px 12px 8px 36px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      color: #0f172a;
      background: #f8fafc;
      transition: all 0.15s ease;
    }
    .filter-input:focus {
      outline: none;
      background: #ffffff;
      border-color: #18d600;
      box-shadow: 0 0 0 3px rgba(24, 214, 0, 0.15);
    }

    /* Sección de Zonas */
    .table-section {
      padding: 0;
      overflow: hidden;
    }
    .table-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
    }
    .table-header h3 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .table-header p {
      font-size: 13px;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .table-meta {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    /* Grid de Zonas */
    .zonas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 1.25rem;
      padding: 1.5rem;
    }
    .zona-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
      transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .zona-card:hover {
      transform: translateY(-2px);
      border-color: rgba(24, 214, 0, 0.4);
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
    }
    .zona-card-header {
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
    }
    .zona-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(24, 214, 0, 0.12);
      color: #15803d;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .zona-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .zona-card-body {
      padding: 14px;
      flex: 1;
    }
    .zona-nombre {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .zona-desc {
      font-size: 12.5px;
      color: #64748b;
      line-height: 1.45;
      margin: 0;
    }
    .zona-card-footer {
      padding: 10px 14px;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
    }
    .zona-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #166534;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #18d600;
      box-shadow: 0 0 6px #18d600;
    }

    /* Acciones */
    .action-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .action-btn:hover {
      background: #f8fafc;
      color: #0f172a;
    }
    .btn-edit:hover {
      border-color: #3b82f6;
      color: #2563eb;
      background: #eff6ff;
    }
    .btn-delete:hover {
      border-color: #ef4444;
      color: #dc2626;
      background: #fef2f2;
    }

    /* Botones */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #18d600;
      color: #052e16;
      border: none;
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(24, 214, 0, 0.25);
      transition: all 0.15s ease;
    }
    .btn-primary:hover:not(:disabled) {
      background: #15be00;
      box-shadow: 0 4px 10px rgba(24, 214, 0, 0.35);
      transform: translateY(-1px);
    }
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 7px 12px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-ghost:hover:not(:disabled) {
      background: #f1f5f9;
      color: #0f172a;
    }
    .btn-danger {
      background: #dc2626;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    /* Estados de Carga y Vacío */
    .loading-state, .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(24, 214, 0, 0.2);
      border-top-color: #18d600;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 12px;
    }
    .spinner-small {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(5, 46, 22, 0.3);
      border-top-color: #052e16;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .empty-icon {
      color: #94a3b8;
      margin-bottom: 12px;
    }
    .empty-state h4 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .empty-state p {
      font-size: 13px;
      color: #64748b;
      margin: 0;
      max-width: 420px;
    }
    .mt-3 {
      margin-top: 1rem;
    }

    /* Modales */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-content {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 100%;
      max-width: 500px;
      overflow: hidden;
      animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .modal-header-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(24, 214, 0, 0.15);
      color: #052e16;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-header h3 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .modal-header p {
      font-size: 12px;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .btn-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
    }
    .btn-close:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    .modal-alert {
      margin: 1rem 1.5rem 0 1.5rem;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .modal-alert.err {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .modal-body {
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .form-group label {
      font-size: 12.5px;
      font-weight: 600;
      color: #334155;
    }
    .required {
      color: #ef4444;
    }
    .form-control {
      padding: 9px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      color: #0f172a;
      background: #ffffff;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .form-control:focus {
      outline: none;
      border-color: #18d600;
      box-shadow: 0 0 0 3px rgba(24, 214, 0, 0.15);
    }
    .input-hint {
      font-size: 11px;
      color: #64748b;
    }
    .modal-footer {
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }
    .justify-center {
      justify-content: center;
    }

    /* Modal de Confirmación */
    .modal-confirm {
      max-width: 440px;
      padding: 1.75rem;
      text-align: center;
    }
    .modal-confirm-icon {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      margin: 0 auto 1rem auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-confirm-icon.icon-danger {
      background: #fee2e2;
      color: #dc2626;
    }
    .modal-confirm h3 {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .confirm-text {
      font-size: 13.5px;
      color: #334155;
      margin: 0 0 6px 0;
    }
    .confirm-subtext {
      font-size: 12px;
      color: #64748b;
      margin: 0 0 1.5rem 0;
      line-height: 1.4;
    }
  `]
})
export class ZonasPageComponent implements OnInit {
  private readonly zonasService = inject(ZonasService);

  zonas = signal<ZonaResponseDTO[]>([]);
  cargando = signal<boolean>(false);
  guardando = signal<boolean>(false);
  mensaje = signal<string | null>(null);
  error = signal<string | null>(null);
  formError = signal<string | null>(null);

  busquedaTexto = '';

  mostrarModalForm = signal<boolean>(false);
  esEdicion = signal<boolean>(false);
  zonaEliminar = signal<ZonaResponseDTO | null>(null);

  formZona: ZonaFormData = {
    nombre: '',
    descripcion: ''
  };

  totalZonas = computed(() => this.zonas().length);
  zonasConDescripcion = computed(() => this.zonas().filter(z => !!z.descripcion && z.descripcion.trim().length > 0).length);

  zonasFiltradas = computed(() => {
    const query = this.busquedaTexto.toLowerCase().trim();
    if (!query) return this.zonas();

    return this.zonas().filter(z =>
      z.nombre.toLowerCase().includes(query) ||
      (z.descripcion && z.descripcion.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.recargarZonas();
  }

  recargarZonas(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.zonasService.listar().subscribe({
      next: (data) => {
        this.zonas.set(data || []);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Error al cargar las zonas de reparto.');
        this.cargando.set(false);
      }
    });
  }

  abrirModalNuevo(): void {
    this.esEdicion.set(false);
    this.formError.set(null);
    this.formZona = {
      nombre: '',
      descripcion: ''
    };
    this.mostrarModalForm.set(true);
  }

  abrirModalEditar(zona: ZonaResponseDTO): void {
    this.esEdicion.set(true);
    this.formError.set(null);
    this.formZona = {
      idZona: zona.idZona,
      nombre: zona.nombre,
      descripcion: zona.descripcion || ''
    };
    this.mostrarModalForm.set(true);
  }

  cerrarModalForm(): void {
    this.mostrarModalForm.set(false);
    this.formError.set(null);
  }

  guardarZona(): void {
    this.formError.set(null);

    if (!this.formZona.nombre || this.formZona.nombre.trim().length === 0) {
      this.formError.set('El nombre de la zona es obligatorio.');
      return;
    }

    const payload: ZonaRequestDTO = {
      nombre: this.formZona.nombre.trim(),
      descripcion: this.formZona.descripcion?.trim() || undefined
    };

    this.guardando.set(true);

    if (this.esEdicion() && this.formZona.idZona) {
      this.zonasService.actualizar(this.formZona.idZona, payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModalForm.set(false);
          this.notificar('Zona de reparto actualizada exitosamente.');
          this.recargarZonas();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.formError.set(err.error?.message || 'Error al actualizar la zona. Verifique que el nombre no esté duplicado.');
        }
      });
    } else {
      this.zonasService.crear(payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModalForm.set(false);
          this.notificar('Zona de reparto registrada exitosamente.');
          this.recargarZonas();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.formError.set(err.error?.message || 'Error al crear la zona. Es posible que el nombre ya exista.');
        }
      });
    }
  }

  abrirModalEliminar(zona: ZonaResponseDTO): void {
    this.zonaEliminar.set(zona);
  }

  cancelarEliminar(): void {
    this.zonaEliminar.set(null);
  }

  confirmarEliminar(): void {
    const z = this.zonaEliminar();
    if (!z) return;

    this.guardando.set(true);
    this.zonasService.eliminar(z.idZona).subscribe({
      next: () => {
        this.guardando.set(false);
        this.zonaEliminar.set(null);
        this.notificar('Zona de reparto eliminada correctamente.');
        this.recargarZonas();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(err.error?.message || 'No se puede eliminar la zona porque tiene rutas o clientes asociados.');
        this.zonaEliminar.set(null);
      }
    });
  }

  private notificar(msg: string): void {
    this.mensaje.set(msg);
    setTimeout(() => {
      if (this.mensaje() === msg) {
        this.mensaje.set(null);
      }
    }, 4000);
  }
}
