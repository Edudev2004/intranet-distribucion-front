import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { RutasService } from '../../rutas.service';
import { RutaRequestDTO, RutaResponseDTO } from '../../ruta.model';
import { ZonasService } from '../../../zonas/zonas.service';
import { ZonaResponseDTO } from '../../../zonas/zona.model';

interface RutaFormData {
  idRuta?: number;
  nombre: string;
  idZona: number | null;
  activo: boolean;
}

@Component({
  selector: 'app-rutas-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent],
  template: `
    <app-page-header
      title="Rutas de Distribución"
      subtitle="Configuración y administración de rutas logísticas por zona de reparto (RF-14)"
    >
      <button type="button" class="btn-primary" (click)="abrirModalNuevo()">
        <app-icon name="plus" [size]="16"></app-icon>
        <span>Nueva Ruta</span>
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

    <!-- KPIs de Rutas -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon icon-total">
          <app-icon name="route" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalRutas() }}</span>
          <span class="stat-label">Total Rutas Registradas</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-active">
          <app-icon name="check-circle" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalActivas() }}</span>
          <span class="stat-label">Rutas Operativas / Activas</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-inactive">
          <app-icon name="x" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalInactivas() }}</span>
          <span class="stat-label">Rutas Inactivas</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-zones">
          <app-icon name="map-pin" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalZonasConRutas() }}</span>
          <span class="stat-label">Zonas con Rutas Asignadas</span>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="content-card filters-bar">
      <div class="filter-group search-group">
        <div class="search-input-wrapper">
          <app-icon name="search" [size]="16" class="search-icon"></app-icon>
          <input
            type="text"
            placeholder="Buscar ruta por nombre o código..."
            [(ngModel)]="busquedaTexto"
            (keyup.enter)="aplicarFiltros()"
            class="filter-input"
          />
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">Zona:</label>
        <select [(ngModel)]="filtroZona" (change)="aplicarFiltros()" class="filter-select">
          <option [ngValue]="null">Todas las zonas</option>
          @for (zona of zonas(); track zona.idZona) {
            <option [ngValue]="zona.idZona">{{ zona.nombre }}</option>
          }
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Estado:</label>
        <select [(ngModel)]="filtroEstado" (change)="aplicarFiltros()" class="filter-select">
          <option value="TODOS">Todos</option>
          <option value="ACTIVOS">Solo Activas</option>
          <option value="INACTIVOS">Solo Inactivas</option>
        </select>
      </div>

      <div class="filter-actions">
        <button type="button" class="btn-secondary" (click)="aplicarFiltros()" [disabled]="cargando()">
          <app-icon name="search" [size]="14"></app-icon>
          <span>Buscar</span>
        </button>
        <button type="button" class="btn-ghost" (click)="limpiarFiltros()" title="Restablecer filtros">
          <app-icon name="refresh" [size]="14"></app-icon>
          <span>Limpiar</span>
        </button>
      </div>
    </div>

    <!-- Tabla de Rutas -->
    <div class="content-card table-section">
      <div class="table-header">
        <div>
          <h3>Catálogo de Rutas de Entrega</h3>
          <p>Rutas definidas por zona para planificación y asignación de despachos</p>
        </div>
        <div class="table-meta">
          <span>Mostrando {{ rutasFiltradas().length }} registros</span>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando catálogo de rutas...</p>
        </div>
      } @else if (rutasFiltradas().length === 0) {
        <div class="empty-state">
          <app-icon name="route" [size]="48" class="empty-icon"></app-icon>
          <h4>No se encontraron rutas de distribución</h4>
          <p>No existen registros que coincidan con los filtros seleccionados o aún no se han configurado rutas.</p>
          <button type="button" class="btn-primary mt-3" (click)="abrirModalNuevo()">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Crear primera ruta</span>
          </button>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre de la Ruta</th>
                <th>Zona de Reparto</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (r of rutasFiltradas(); track r.idRuta) {
                <tr [class.row-inactive]="!r.activo">
                  <td>
                    <span class="route-id-badge">R-{{ r.idRuta }}</span>
                  </td>
                  <td>
                    <div class="route-name-cell">
                      <app-icon name="route" [size]="16" class="route-icon"></app-icon>
                      <span class="route-name">{{ r.nombre }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="zone-badge">
                      <app-icon name="map-pin" [size]="13"></app-icon>
                      <span>{{ r.nombreZona }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="status-pill" [class.active]="r.activo" [class.inactive]="!r.activo">
                      <span class="status-dot"></span>
                      {{ r.activo ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>
                  <td>
                    <div class="actions-cell">
                      <button
                        type="button"
                        class="action-btn btn-edit"
                        title="Editar ruta"
                        (click)="abrirModalEditar(r)"
                      >
                        <app-icon name="edit" [size]="15"></app-icon>
                      </button>
                      <button
                        type="button"
                        class="action-btn btn-toggle"
                        [title]="r.activo ? 'Desactivar ruta' : 'Activar ruta'"
                        (click)="abrirModalToggleEstado(r)"
                      >
                        <app-icon [name]="r.activo ? 'x' : 'check'" [size]="15"></app-icon>
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

    <!-- Modal Formulario: Crear / Editar Ruta -->
    @if (mostrarModalForm()) {
      <div class="modal-backdrop" (click)="cerrarModalForm()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="modal-header-icon">
                <app-icon [name]="esEdicion() ? 'edit' : 'plus'" [size]="18"></app-icon>
              </div>
              <div>
                <h3>{{ esEdicion() ? 'Editar Ruta de Distribución' : 'Registrar Nueva Ruta' }}</h3>
                <p>{{ esEdicion() ? 'Actualice la información y zona de reparto de la ruta' : 'Defina una ruta logística asociada a una zona de distribución' }}</p>
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

          <form (ngSubmit)="guardarRuta()" class="modal-body">
            <div class="form-group">
              <label>Zona de Reparto <span class="required">*</span></label>
              <select
                [(ngModel)]="formRuta.idZona"
                name="idZona"
                required
                class="form-control"
              >
                <option [ngValue]="null" disabled>Seleccione una zona...</option>
                @for (z of zonas(); track z.idZona) {
                  <option [ngValue]="z.idZona">{{ z.nombre }}</option>
                }
              </select>
              <span class="input-hint">Sector territorial en el que operará esta ruta.</span>
            </div>

            <div class="form-group">
              <label>Nombre de la Ruta <span class="required">*</span></label>
              <input
                type="text"
                [(ngModel)]="formRuta.nombre"
                name="nombre"
                required
                maxlength="100"
                placeholder="Ej. Ruta Norte 01 - Comas / Los Olivos"
                class="form-control"
              />
              <span class="input-hint">Nombre descriptivo único dentro de la zona seleccionada.</span>
            </div>

            <div class="form-group-checkbox">
              <label class="checkbox-container">
                <input
                  type="checkbox"
                  [(ngModel)]="formRuta.activo"
                  name="activo"
                />
                <span class="checkbox-mark"></span>
                <span class="checkbox-label">Ruta habilitada para programación y asignación de despachos</span>
              </label>
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
                  <span>{{ esEdicion() ? 'Actualizar Ruta' : 'Guardar Ruta' }}</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal Confirmar Cambio de Estado -->
    @if (rutaToggle()) {
      <div class="modal-backdrop" (click)="cancelarToggle()">
        <div class="modal-content modal-confirm" (click)="$event.stopPropagation()">
          <div class="modal-confirm-icon" [class.icon-warn]="rutaToggle()?.activo" [class.icon-ok]="!rutaToggle()?.activo">
            <app-icon [name]="rutaToggle()?.activo ? 'alert' : 'check-circle'" [size]="28"></app-icon>
          </div>
          <h3>¿Desea {{ rutaToggle()?.activo ? 'desactivar' : 'activar' }} esta ruta?</h3>
          <p class="confirm-text">
            Ruta: <strong>{{ rutaToggle()?.nombre }}</strong> ({{ rutaToggle()?.nombreZona }})
          </p>
          <p class="confirm-subtext">
            {{ rutaToggle()?.activo 
              ? 'Al desactivarla, la ruta no estará disponible para nuevas programaciones de despacho.' 
              : 'La ruta quedará habilitada para asignación de vehículos y choferes.' }}
          </p>
          <div class="modal-footer justify-center">
            <button type="button" class="btn-ghost" (click)="cancelarToggle()">Cancelar</button>
            <button
              type="button"
              class="btn-primary"
              [class.btn-danger]="rutaToggle()?.activo"
              (click)="confirmarToggle()"
              [disabled]="guardando()"
            >
              {{ rutaToggle()?.activo ? 'Desactivar Ruta' : 'Activar Ruta' }}
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
      background: rgba(15, 23, 42, 0.06);
      color: #0f172a;
    }
    .icon-active {
      background: rgba(24, 214, 0, 0.12);
      color: #15803d;
    }
    .icon-inactive {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }
    .icon-zones {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
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

    /* Barra de Filtros */
    .filters-bar {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .search-group {
      flex: 1;
      min-width: 240px;
    }
    .search-input-wrapper {
      position: relative;
      width: 100%;
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
    .filter-label {
      font-size: 12.5px;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
    }
    .filter-select {
      padding: 7px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      color: #0f172a;
      background: #ffffff;
    }
    .filter-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    /* Sección de Tabla */
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
    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    .data-table th {
      background: #f8fafc;
      padding: 11px 16px;
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
    }
    .data-table tr:hover {
      background: #f8fafc;
    }
    .row-inactive {
      opacity: 0.65;
      background: #fbfbfb;
    }

    /* Celda Código */
    .route-id-badge {
      font-family: ui-monospace, monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    /* Celda Ruta */
    .route-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .route-icon {
      color: #15803d;
      flex-shrink: 0;
    }
    .route-name {
      font-weight: 600;
      color: #0f172a;
    }

    /* Celda Zona */
    .zone-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 9px;
      border-radius: 6px;
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
      font-size: 12px;
      font-weight: 600;
    }

    /* Estado Pill */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11.5px;
      font-weight: 600;
    }
    .status-pill.active {
      background: rgba(24, 214, 0, 0.12);
      color: #166534;
      border: 1px solid rgba(24, 214, 0, 0.25);
    }
    .status-pill.inactive {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #cbd5e1;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .status-pill.active .status-dot {
      background: #18d600;
      box-shadow: 0 0 6px #18d600;
    }
    .status-pill.inactive .status-dot {
      background: #94a3b8;
    }

    /* Acciones */
    .actions-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }
    .action-btn {
      width: 30px;
      height: 30px;
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
    .btn-toggle:hover {
      border-color: #10b981;
      color: #059669;
      background: #ecfdf5;
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
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0f172a;
      color: #ffffff;
      border: none;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-secondary:hover:not(:disabled) {
      background: #1e293b;
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
    .form-group-checkbox {
      padding: 8px 0;
    }
    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 13px;
      color: #334155;
      user-select: none;
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
    .modal-confirm-icon.icon-warn {
      background: #fef3c7;
      color: #d97706;
    }
    .modal-confirm-icon.icon-ok {
      background: rgba(24, 214, 0, 0.15);
      color: #15803d;
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
export class RutasPageComponent implements OnInit {
  private readonly rutasService = inject(RutasService);
  private readonly zonasService = inject(ZonasService);

  rutas = signal<RutaResponseDTO[]>([]);
  zonas = signal<ZonaResponseDTO[]>([]);
  cargando = signal<boolean>(false);
  guardando = signal<boolean>(false);
  mensaje = signal<string | null>(null);
  error = signal<string | null>(null);
  formError = signal<string | null>(null);

  busquedaTexto = '';
  filtroZona: number | null = null;
  filtroEstado: 'TODOS' | 'ACTIVOS' | 'INACTIVOS' = 'TODOS';

  mostrarModalForm = signal<boolean>(false);
  esEdicion = signal<boolean>(false);
  rutaToggle = signal<RutaResponseDTO | null>(null);

  formRuta: RutaFormData = {
    nombre: '',
    idZona: null,
    activo: true
  };

  totalRutas = computed(() => this.rutas().length);
  totalActivas = computed(() => this.rutas().filter(r => r.activo).length);
  totalInactivas = computed(() => this.rutas().filter(r => !r.activo).length);
  totalZonasConRutas = computed(() => new Set(this.rutas().map(r => r.idZona)).size);

  rutasFiltradas = computed(() => {
    let lista = this.rutas();

    const query = this.busquedaTexto.toLowerCase().trim();
    if (query) {
      lista = lista.filter(r =>
        r.nombre.toLowerCase().includes(query) ||
        r.nombreZona.toLowerCase().includes(query) ||
        `r-${r.idRuta}`.includes(query)
      );
    }

    if (this.filtroEstado === 'ACTIVOS') {
      lista = lista.filter(r => r.activo);
    } else if (this.filtroEstado === 'INACTIVOS') {
      lista = lista.filter(r => !r.activo);
    }

    return lista;
  });

  ngOnInit(): void {
    this.cargarZonas();
    this.cargarRutas();
  }

  cargarZonas(): void {
    this.zonasService.listar().subscribe({
      next: (data) => this.zonas.set(data || []),
      error: () => this.zonas.set([])
    });
  }

  cargarRutas(): void {
    this.cargando.set(true);
    this.error.set(null);

    const soloActivos = this.filtroEstado === 'ACTIVOS' ? true : (this.filtroEstado === 'INACTIVOS' ? false : undefined);

    this.rutasService.listar(this.filtroZona ?? undefined, soloActivos).subscribe({
      next: (data) => {
        this.rutas.set(data || []);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Error al cargar las rutas de distribución.');
        this.cargando.set(false);
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarRutas();
  }

  limpiarFiltros(): void {
    this.busquedaTexto = '';
    this.filtroZona = null;
    this.filtroEstado = 'TODOS';
    this.cargarRutas();
  }

  abrirModalNuevo(): void {
    this.esEdicion.set(false);
    this.formError.set(null);
    const zonasList = this.zonas();
    this.formRuta = {
      nombre: '',
      idZona: zonasList.length > 0 ? zonasList[0].idZona : null,
      activo: true
    };
    this.mostrarModalForm.set(true);
  }

  abrirModalEditar(ruta: RutaResponseDTO): void {
    this.esEdicion.set(true);
    this.formError.set(null);
    this.formRuta = {
      idRuta: ruta.idRuta,
      nombre: ruta.nombre,
      idZona: ruta.idZona,
      activo: ruta.activo
    };
    this.mostrarModalForm.set(true);
  }

  cerrarModalForm(): void {
    this.mostrarModalForm.set(false);
    this.formError.set(null);
  }

  guardarRuta(): void {
    this.formError.set(null);

    if (!this.formRuta.idZona) {
      this.formError.set('Debe seleccionar una zona de reparto.');
      return;
    }
    if (!this.formRuta.nombre || this.formRuta.nombre.trim().length === 0) {
      this.formError.set('El nombre de la ruta es obligatorio.');
      return;
    }

    const payload: RutaRequestDTO = {
      nombre: this.formRuta.nombre.trim(),
      idZona: this.formRuta.idZona,
      activo: this.formRuta.activo
    };

    this.guardando.set(true);

    if (this.esEdicion() && this.formRuta.idRuta) {
      this.rutasService.actualizar(this.formRuta.idRuta, payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModalForm.set(false);
          this.notificar('Ruta de distribución actualizada exitosamente.');
          this.cargarRutas();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.formError.set(err.error?.message || 'Error al actualizar la ruta. Verifique que no exista otra ruta con ese nombre en la misma zona.');
        }
      });
    } else {
      this.rutasService.crear(payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModalForm.set(false);
          this.notificar('Ruta de distribución registrada exitosamente.');
          this.cargarRutas();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.formError.set(err.error?.message || 'Error al registrar la ruta. Ya existe una ruta con ese nombre en la zona seleccionada.');
        }
      });
    }
  }

  abrirModalToggleEstado(ruta: RutaResponseDTO): void {
    this.rutaToggle.set(ruta);
  }

  cancelarToggle(): void {
    this.rutaToggle.set(null);
  }

  confirmarToggle(): void {
    const r = this.rutaToggle();
    if (!r) return;

    const nuevoEstado = !r.activo;
    this.guardando.set(true);

    this.rutasService.cambiarEstado(r.idRuta, nuevoEstado).subscribe({
      next: () => {
        this.guardando.set(false);
        this.rutaToggle.set(null);
        this.notificar(`Ruta ${nuevoEstado ? 'activada' : 'desactivada'} correctamente.`);
        this.cargarRutas();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(err.error?.message || 'Error al cambiar el estado de la ruta.');
        this.rutaToggle.set(null);
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
