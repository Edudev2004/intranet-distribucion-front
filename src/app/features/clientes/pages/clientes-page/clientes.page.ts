import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ClientesService } from '../../clientes.service';
import {
  ClienteRequestDTO,
  ClienteResponseDTO,
  TipoDocumentoDTO
} from '../../cliente.model';

interface ClienteFormData {
  idCliente?: number;
  idTipoDocumento: number | null;
  numeroDocumento: string;
  nombreRazonSocial: string;
  direccion: string;
  telefono: string;
  correo: string;
  activo: boolean;
}

@Component({
  selector: 'app-clientes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent],
  template: `
    <app-page-header
      title="Gestión de Clientes"
      subtitle="Registro, administración y validación de clientes por documento oficial (RF-09)"
    >
      <button type="button" class="btn-primary" (click)="abrirModalNuevo()">
        <app-icon name="plus" [size]="16"></app-icon>
        <span>Nuevo Cliente</span>
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

    <!-- KPIs de Clientes -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon icon-total">
          <app-icon name="users" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalClientes() }}</span>
          <span class="stat-label">Total Clientes</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-active">
          <app-icon name="check-circle" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalActivos() }}</span>
          <span class="stat-label">Clientes Activos</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-inactive">
          <app-icon name="x" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalInactivos() }}</span>
          <span class="stat-label">Clientes Inactivos</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-ruc">
          <app-icon name="tag" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalEmpresasRuc() }}</span>
          <span class="stat-label">Empresas (RUC)</span>
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
            placeholder="Buscar por RUC, DNI o razón social..."
            [(ngModel)]="busquedaTexto"
            (keyup.enter)="aplicarFiltros()"
            class="filter-input"
          />
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">Estado:</label>
        <select [(ngModel)]="filtroEstado" (change)="aplicarFiltros()" class="filter-select">
          <option value="TODOS">Todos</option>
          <option value="ACTIVOS">Solo Activos</option>
          <option value="INACTIVOS">Solo Inactivos</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Tipo Doc:</label>
        <select [(ngModel)]="filtroTipoDoc" (change)="aplicarFiltros()" class="filter-select">
          <option [ngValue]="null">Todos</option>
          @for (tipo of tiposDocumento(); track tipo.idTipoDocumento) {
            <option [ngValue]="tipo.idTipoDocumento">{{ tipo.nombre }}</option>
          }
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

    <!-- Tabla de Clientes -->
    <div class="content-card table-section">
      <div class="table-header">
        <div>
          <h3>Directorio de Clientes</h3>
          <p>Listado de clientes registrados para facturación y generación de pedidos</p>
        </div>
        <div class="table-meta">
          <span>Mostrando {{ clientesFiltrados().length }} registros</span>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando información de clientes...</p>
        </div>
      } @else if (clientesFiltrados().length === 0) {
        <div class="empty-state">
          <app-icon name="users" [size]="48" class="empty-icon"></app-icon>
          <h4>No se encontraron clientes</h4>
          <p>No hay registros coincidentes con los filtros seleccionados o aún no se han registrado clientes.</p>
          <button type="button" class="btn-primary mt-3" (click)="abrirModalNuevo()">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Registrar primer cliente</span>
          </button>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Nombre / Razón Social</th>
                <th>Contacto</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (c of clientesFiltrados(); track c.idCliente) {
                <tr [class.row-inactive]="!c.activo">
                  <td>
                    <div class="doc-badge-group">
                      <span class="doc-type-badge" [class.badge-ruc]="esRuc(c)">
                        {{ c.tipoDocumentoNombre || 'DOC' }}
                      </span>
                      <span class="doc-number">{{ c.numeroDocumento }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="client-name-cell">
                      <span class="client-name">{{ c.nombreRazonSocial }}</span>
                      @if (c.zonaNombre) {
                        <span class="client-zone">Zona: {{ c.zonaNombre }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="contact-cell">
                      @if (c.telefono) {
                        <span class="contact-item">
                          <span class="contact-label">Tel:</span> {{ c.telefono }}
                        </span>
                      }
                      @if (c.correo) {
                        <span class="contact-item">
                          <span class="contact-label">Email:</span> {{ c.correo }}
                        </span>
                      }
                      @if (!c.telefono && !c.correo) {
                        <span class="text-muted">Sin contacto</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="address-text" [title]="c.direccion">{{ c.direccion }}</span>
                  </td>
                  <td>
                    <span class="status-pill" [class.active]="c.activo" [class.inactive]="!c.activo">
                      <span class="status-dot"></span>
                      {{ c.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="actions-cell">
                      <button
                        type="button"
                        class="action-btn btn-edit"
                        title="Editar cliente"
                        (click)="abrirModalEditar(c)"
                      >
                        <app-icon name="edit" [size]="15"></app-icon>
                      </button>
                      <button
                        type="button"
                        class="action-btn btn-toggle"
                        [title]="c.activo ? 'Desactivar cliente' : 'Activar cliente'"
                        (click)="abrirModalToggleEstado(c)"
                      >
                        <app-icon [name]="c.activo ? 'x' : 'check'" [size]="15"></app-icon>
                      </button>
                      <button
                        type="button"
                        class="action-btn btn-delete"
                        title="Eliminar cliente"
                        (click)="abrirModalEliminar(c)"
                      >
                        <app-icon name="trash" [size]="15"></app-icon>
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

    <!-- Modal Formulario: Crear / Editar Cliente -->
    @if (mostrarModalForm()) {
      <div class="modal-backdrop" (click)="cerrarModalForm()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="modal-header-icon">
                <app-icon [name]="esEdicion() ? 'edit' : 'plus'" [size]="18"></app-icon>
              </div>
              <div>
                <h3>{{ esEdicion() ? 'Editar Cliente' : 'Registrar Nuevo Cliente' }}</h3>
                <p>{{ esEdicion() ? 'Actualice la información y razón social del cliente' : 'Ingrese los datos de identificación oficial del cliente' }}</p>
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

          <form (ngSubmit)="guardarCliente()" class="modal-body">
            <div class="form-row-2">
              <div class="form-group">
                <label>Tipo de Documento <span class="required">*</span></label>
                <select
                  [(ngModel)]="formCliente.idTipoDocumento"
                  name="idTipoDocumento"
                  required
                  class="form-control"
                  (change)="alCambiarTipoDoc()"
                >
                  <option [ngValue]="null" disabled>Seleccione tipo...</option>
                  @for (tipo of tiposDocumento(); track tipo.idTipoDocumento) {
                    <option [ngValue]="tipo.idTipoDocumento">{{ tipo.nombre }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Número de Documento <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="formCliente.numeroDocumento"
                  name="numeroDocumento"
                  required
                  [placeholder]="placeholderDoc()"
                  [maxlength]="maxlengthDoc()"
                  class="form-control"
                />
                <span class="input-hint">{{ hintDoc() }}</span>
              </div>
            </div>

            <div class="form-group">
              <label>Nombre o Razón Social <span class="required">*</span></label>
              <input
                type="text"
                [(ngModel)]="formCliente.nombreRazonSocial"
                name="nombreRazonSocial"
                required
                maxlength="255"
                placeholder="Ej. Distribuidora del Norte S.A.C."
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label>Dirección Fiscal / Entrega <span class="required">*</span></label>
              <input
                type="text"
                [(ngModel)]="formCliente.direccion"
                name="direccion"
                required
                maxlength="255"
                placeholder="Ej. Av. Argentina 1450, Callao"
                class="form-control"
              />
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  [(ngModel)]="formCliente.telefono"
                  name="telefono"
                  maxlength="20"
                  placeholder="Ej. 987654321"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  [(ngModel)]="formCliente.correo"
                  name="correo"
                  maxlength="100"
                  placeholder="Ej. contacto@empresa.com"
                  class="form-control"
                />
              </div>
            </div>

            <div class="form-group-checkbox">
              <label class="checkbox-container">
                <input
                  type="checkbox"
                  [(ngModel)]="formCliente.activo"
                  name="activo"
                />
                <span class="checkbox-mark"></span>
                <span class="checkbox-label">Cliente habilitado para realizar pedidos y facturación</span>
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
                  <span>{{ esEdicion() ? 'Actualizar Cliente' : 'Guardar Cliente' }}</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal Confirmar Cambio de Estado -->
    @if (clienteToggle()) {
      <div class="modal-backdrop" (click)="cancelarToggle()">
        <div class="modal-content modal-confirm" (click)="$event.stopPropagation()">
          <div class="modal-confirm-icon" [class.icon-warn]="clienteToggle()?.activo" [class.icon-ok]="!clienteToggle()?.activo">
            <app-icon [name]="clienteToggle()?.activo ? 'alert' : 'check-circle'" [size]="28"></app-icon>
          </div>
          <h3>¿Desea {{ clienteToggle()?.activo ? 'desactivar' : 'activar' }} este cliente?</h3>
          <p class="confirm-text">
            Cliente: <strong>{{ clienteToggle()?.nombreRazonSocial }}</strong> ({{ clienteToggle()?.numeroDocumento }})
          </p>
          <p class="confirm-subtext">
            {{ clienteToggle()?.activo 
              ? 'Al desactivarlo, no podrá seleccionarse para nuevos pedidos ni comprobantes.' 
              : 'El cliente quedará habilitado para emisión de pedidos y facturación.' }}
          </p>
          <div class="modal-footer justify-center">
            <button type="button" class="btn-ghost" (click)="cancelarToggle()">Cancelar</button>
            <button
              type="button"
              class="btn-primary"
              [class.btn-danger]="clienteToggle()?.activo"
              (click)="confirmarToggle()"
              [disabled]="guardando()"
            >
              {{ clienteToggle()?.activo ? 'Desactivar Cliente' : 'Activar Cliente' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Confirmar Eliminación -->
    @if (clienteEliminar()) {
      <div class="modal-backdrop" (click)="cancelarEliminar()">
        <div class="modal-content modal-confirm" (click)="$event.stopPropagation()">
          <div class="modal-confirm-icon icon-danger">
            <app-icon name="trash" [size]="28"></app-icon>
          </div>
          <h3>¿Eliminar cliente del sistema?</h3>
          <p class="confirm-text">
            Se eliminará a <strong>{{ clienteEliminar()?.nombreRazonSocial }}</strong> ({{ clienteEliminar()?.numeroDocumento }}).
          </p>
          <p class="confirm-subtext">
            Esta acción retira el registro del directorio. Si tiene pedidos o facturas asociadas se aplicará desactivación segura.
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
    .icon-ruc {
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

    /* Celda Documento */
    .doc-badge-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .doc-type-badge {
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: #e2e8f0;
      color: #334155;
      letter-spacing: 0.3px;
    }
    .doc-type-badge.badge-ruc {
      background: rgba(37, 99, 235, 0.12);
      color: #1d4ed8;
    }
    .doc-number {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 600;
      color: #0f172a;
    }

    /* Celda Cliente */
    .client-name-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .client-name {
      font-weight: 600;
      color: #0f172a;
    }
    .client-zone {
      font-size: 11.5px;
      color: #64748b;
    }

    /* Celda Contacto */
    .contact-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 12px;
    }
    .contact-item {
      color: #334155;
    }
    .contact-label {
      font-weight: 600;
      color: #64748b;
    }
    .address-text {
      display: block;
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #475569;
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
    .btn-delete:hover {
      border-color: #ef4444;
      color: #dc2626;
      background: #fef2f2;
    }

    /* Botones Globales */
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
      max-width: 540px;
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
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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
    .modal-confirm-icon.icon-danger {
      background: #fee2e2;
      color: #dc2626;
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
export class ClientesPageComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);

  // Estados reactivos (Signals)
  clientes = signal<ClienteResponseDTO[]>([]);
  tiposDocumento = signal<TipoDocumentoDTO[]>([]);
  cargando = signal<boolean>(false);
  guardando = signal<boolean>(false);
  mensaje = signal<string | null>(null);
  error = signal<string | null>(null);
  formError = signal<string | null>(null);

  // Filtros
  busquedaTexto = '';
  filtroEstado: 'TODOS' | 'ACTIVOS' | 'INACTIVOS' = 'TODOS';
  filtroTipoDoc: number | null = null;

  // Modales
  mostrarModalForm = signal<boolean>(false);
  esEdicion = signal<boolean>(false);
  clienteToggle = signal<ClienteResponseDTO | null>(null);
  clienteEliminar = signal<ClienteResponseDTO | null>(null);

  // Formulario reactivo
  formCliente: ClienteFormData = {
    idTipoDocumento: null,
    numeroDocumento: '',
    nombreRazonSocial: '',
    direccion: '',
    telefono: '',
    correo: '',
    activo: true
  };

  // KPIs computados
  totalClientes = computed(() => this.clientes().length);
  totalActivos = computed(() => this.clientes().filter(c => c.activo).length);
  totalInactivos = computed(() => this.clientes().filter(c => !c.activo).length);
  totalEmpresasRuc = computed(() =>
    this.clientes().filter(c => (c.tipoDocumentoNombre || '').toUpperCase().includes('RUC') || c.numeroDocumento.length === 11).length
  );

  // Listado filtrado en memoria por los selectores
  clientesFiltrados = computed(() => {
    let lista = this.clientes();
    if (this.filtroTipoDoc !== null) {
      lista = lista.filter(c => c.idTipoDocumento === this.filtroTipoDoc);
    }
    if (this.filtroEstado === 'ACTIVOS') {
      lista = lista.filter(c => c.activo);
    } else if (this.filtroEstado === 'INACTIVOS') {
      lista = lista.filter(c => !c.activo);
    }
    return lista;
  });

  ngOnInit(): void {
    this.cargarTiposDocumento();
    this.cargarClientes();
  }

  cargarTiposDocumento(): void {
    this.clientesService.listarTiposDocumento().subscribe({
      next: (tipos) => {
        if (tipos && tipos.length > 0) {
          this.tiposDocumento.set(tipos);
        } else {
          // Tipos por defecto si no están inicializados
          this.tiposDocumento.set([
            { idTipoDocumento: 1, nombre: 'DNI' },
            { idTipoDocumento: 2, nombre: 'RUC' },
            { idTipoDocumento: 3, nombre: 'Carnet de Extranjería' },
            { idTipoDocumento: 4, nombre: 'Pasaporte' }
          ]);
        }
      },
      error: () => {
        this.tiposDocumento.set([
          { idTipoDocumento: 1, nombre: 'DNI' },
          { idTipoDocumento: 2, nombre: 'RUC' },
          { idTipoDocumento: 3, nombre: 'Carnet de Extranjería' },
          { idTipoDocumento: 4, nombre: 'Pasaporte' }
        ]);
      }
    });
  }

  cargarClientes(): void {
    this.cargando.set(true);
    this.error.set(null);

    const soloActivos = this.filtroEstado === 'ACTIVOS' ? true : (this.filtroEstado === 'INACTIVOS' ? false : undefined);

    this.clientesService.listar(this.busquedaTexto, soloActivos).subscribe({
      next: (data) => {
        this.clientes.set(data || []);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Error al cargar clientes desde el servidor.');
        this.cargando.set(false);
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarClientes();
  }

  limpiarFiltros(): void {
    this.busquedaTexto = '';
    this.filtroEstado = 'TODOS';
    this.filtroTipoDoc = null;
    this.cargarClientes();
  }

  esRuc(cliente: ClienteResponseDTO): boolean {
    return (cliente.tipoDocumentoNombre || '').toUpperCase().includes('RUC') || cliente.numeroDocumento.length === 11;
  }

  placeholderDoc(): string {
    const tipo = this.tiposDocumento().find(t => t.idTipoDocumento === this.formCliente.idTipoDocumento);
    const nombre = tipo?.nombre.toUpperCase() || '';
    if (nombre.includes('DNI')) return '8 dígitos numéricos';
    if (nombre.includes('RUC')) return '11 dígitos numéricos';
    return 'Número de documento oficial';
  }

  maxlengthDoc(): number {
    const tipo = this.tiposDocumento().find(t => t.idTipoDocumento === this.formCliente.idTipoDocumento);
    const nombre = tipo?.nombre.toUpperCase() || '';
    if (nombre.includes('DNI')) return 8;
    if (nombre.includes('RUC')) return 11;
    return 20;
  }

  hintDoc(): string {
    const tipo = this.tiposDocumento().find(t => t.idTipoDocumento === this.formCliente.idTipoDocumento);
    const nombre = tipo?.nombre.toUpperCase() || '';
    if (nombre.includes('DNI')) return 'DNI oficial peruano: 8 dígitos numéricos.';
    if (nombre.includes('RUC')) return 'RUC SUNAT: 11 dígitos numéricos (inicia con 10 o 20).';
    return 'Documento válido de identidad o tributario.';
  }

  alCambiarTipoDoc(): void {
    // Si cambia tipo y el número excede la longitud, recortar
    const max = this.maxlengthDoc();
    if (this.formCliente.numeroDocumento && this.formCliente.numeroDocumento.length > max) {
      this.formCliente.numeroDocumento = this.formCliente.numeroDocumento.slice(0, max);
    }
  }

  abrirModalNuevo(): void {
    this.esEdicion.set(false);
    this.formError.set(null);
    const tipos = this.tiposDocumento();
    this.formCliente = {
      idTipoDocumento: tipos.length > 0 ? tipos[0].idTipoDocumento : 1,
      numeroDocumento: '',
      nombreRazonSocial: '',
      direccion: '',
      telefono: '',
      correo: '',
      activo: true
    };
    this.mostrarModalForm.set(true);
  }

  abrirModalEditar(cliente: ClienteResponseDTO): void {
    this.esEdicion.set(true);
    this.formError.set(null);
    this.formCliente = {
      idCliente: cliente.idCliente,
      idTipoDocumento: cliente.idTipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      nombreRazonSocial: cliente.nombreRazonSocial,
      direccion: cliente.direccion,
      telefono: cliente.telefono || '',
      correo: cliente.correo || '',
      activo: cliente.activo
    };
    this.mostrarModalForm.set(true);
  }

  cerrarModalForm(): void {
    this.mostrarModalForm.set(false);
    this.formError.set(null);
  }

  guardarCliente(): void {
    this.formError.set(null);

    if (!this.formCliente.idTipoDocumento) {
      this.formError.set('Debe seleccionar un tipo de documento.');
      return;
    }
    if (!this.formCliente.numeroDocumento || this.formCliente.numeroDocumento.trim().length === 0) {
      this.formError.set('El número de documento es obligatorio.');
      return;
    }
    if (!this.formCliente.nombreRazonSocial || this.formCliente.nombreRazonSocial.trim().length === 0) {
      this.formError.set('El nombre o razón social es obligatorio.');
      return;
    }
    if (!this.formCliente.direccion || this.formCliente.direccion.trim().length === 0) {
      this.formError.set('La dirección es obligatoria.');
      return;
    }

    const docTrim = this.formCliente.numeroDocumento.trim();
    const tipo = this.tiposDocumento().find(t => t.idTipoDocumento === this.formCliente.idTipoDocumento);
    const nombreTipo = tipo?.nombre.toUpperCase() || '';

    if (nombreTipo.includes('DNI') && !/^\d{8}$/.test(docTrim)) {
      this.formError.set('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }
    if (nombreTipo.includes('RUC') && !/^\d{11}$/.test(docTrim)) {
      this.formError.set('El RUC debe contener exactamente 11 dígitos numéricos.');
      return;
    }

    const payload: ClienteRequestDTO = {
      idTipoDocumento: this.formCliente.idTipoDocumento,
      numeroDocumento: docTrim,
      nombreRazonSocial: this.formCliente.nombreRazonSocial.trim(),
      direccion: this.formCliente.direccion.trim(),
      telefono: this.formCliente.telefono?.trim() || undefined,
      correo: this.formCliente.correo?.trim() || undefined,
      activo: this.formCliente.activo
    };

    this.guardando.set(true);

    if (this.esEdicion() && this.formCliente.idCliente) {
      this.clientesService.actualizar(this.formCliente.idCliente, payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModalForm.set(false);
          this.notificar('Cliente actualizado exitosamente.');
          this.cargarClientes();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.formError.set(err.error?.message || 'Error al actualizar el cliente. Verifique que el documento no esté duplicado.');
        }
      });
    } else {
      this.clientesService.crear(payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModalForm.set(false);
          this.notificar('Cliente registrado exitosamente.');
          this.cargarClientes();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.formError.set(err.error?.message || 'Error al registrar el cliente. Es posible que el documento ya esté registrado.');
        }
      });
    }
  }

  // Toggle estado
  abrirModalToggleEstado(cliente: ClienteResponseDTO): void {
    this.clienteToggle.set(cliente);
  }

  cancelarToggle(): void {
    this.clienteToggle.set(null);
  }

  confirmarToggle(): void {
    const c = this.clienteToggle();
    if (!c) return;

    const nuevoEstado = !c.activo;
    this.guardando.set(true);

    this.clientesService.cambiarEstado(c.idCliente, nuevoEstado).subscribe({
      next: () => {
        this.guardando.set(false);
        this.clienteToggle.set(null);
        this.notificar(`Cliente ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`);
        this.cargarClientes();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(err.error?.message || 'Error al cambiar el estado del cliente.');
        this.clienteToggle.set(null);
      }
    });
  }

  // Eliminación
  abrirModalEliminar(cliente: ClienteResponseDTO): void {
    this.clienteEliminar.set(cliente);
  }

  cancelarEliminar(): void {
    this.clienteEliminar.set(null);
  }

  confirmarEliminar(): void {
    const c = this.clienteEliminar();
    if (!c) return;

    this.guardando.set(true);
    this.clientesService.eliminar(c.idCliente).subscribe({
      next: () => {
        this.guardando.set(false);
        this.clienteEliminar.set(null);
        this.notificar('Cliente eliminado correctamente.');
        this.cargarClientes();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(err.error?.message || 'Error al eliminar el cliente.');
        this.clienteEliminar.set(null);
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
