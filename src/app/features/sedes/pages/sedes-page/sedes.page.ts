import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SedesService } from '../../sedes.service';
import { ResponsableSede, Sede, SedeRequest } from '../../sede.model';
import { SupabaseStorageService } from '../../../../core/services/supabase-storage.service';

@Component({
  selector: 'app-sedes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent],
  template: `
    <app-page-header
      title="Gestión de Sedes y Centros Operativos"
      subtitle="Administración de hubs de distribución, almacenes asociados y personal responsable"
    >
      <button type="button" class="btn-primary" (click)="abrirModalCrear()">
        <app-icon name="plus" [size]="18"></app-icon>
        <span>Nueva Sede</span>
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

    <!-- Métricas y Estadísticas Rápidas -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon icon-hub">
          <app-icon name="warehouse" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ sedes().length }}</span>
          <span class="stat-label">Total de Sedes</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-active">
          <app-icon name="truck" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ sedesActivasCount() }}</span>
          <span class="stat-label">Sedes Operativas</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-almacenes">
          <app-icon name="inventory" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalAlmacenesCount() }}</span>
          <span class="stat-label">Almacenes Vinculados</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-usuarios">
          <app-icon name="users" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalUsuariosCount() }}</span>
          <span class="stat-label">Colaboradores</span>
        </div>
      </div>
    </div>

    <!-- Barra de Herramientas y Filtros -->
    <div class="content-card toolbar-card">
      <div class="search-box">
        <app-icon name="search" [size]="18"></app-icon>
        <input
          type="text"
          placeholder="Buscar sede por nombre o dirección..."
          [(ngModel)]="busqueda"
        />
      </div>

      <div class="filters-group">
        <select [(ngModel)]="filtroEstado">
          <option value="todos">Todos los estados</option>
          <option value="activos">Solo activas</option>
          <option value="inactivos">Solo inactivas</option>
        </select>

        <div class="view-toggle">
          <button
            type="button"
            class="toggle-btn"
            [class.active]="viewMode() === 'grid'"
            (click)="viewMode.set('grid')"
            title="Vista en tarjetas visuales"
          >
            <app-icon name="dashboard" [size]="17"></app-icon>
            <span>Tarjetas</span>
          </button>
          <button
            type="button"
            class="toggle-btn"
            [class.active]="viewMode() === 'table'"
            (click)="viewMode.set('table')"
            title="Vista en tabla densa"
          >
            <app-icon name="invoice" [size]="17"></app-icon>
            <span>Tabla</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Estado de Carga -->
    @if (cargando()) {
      <div class="content-card loading-container">
        <div class="spinner"></div>
        <span>Cargando sedes operativas...</span>
      </div>
    } @else {
      <!-- VISTA EN TARJETAS (CARDS GRID CON FOTO) -->
      @if (viewMode() === 'grid') {
        @if (sedesFiltradas().length > 0) {
          <div class="sedes-grid">
            @for (s of sedesFiltradas(); track s.idSede) {
              <div class="sede-card" [class.inactive]="!s.activo">
                <!-- Portada con Imagen y Badge flotante -->
                <div class="card-cover">
                  <img
                    [src]="obtenerFotoSede(s)"
                    [alt]="s.nombre"
                    class="cover-image"
                    loading="lazy"
                  />
                  <div class="cover-overlay"></div>
                  <span class="status-pill" [class.active]="s.activo">
                    <span class="status-dot"></span>
                    {{ s.activo ? 'Operativa' : 'Inactiva' }}
                  </span>
                  <div class="sede-id-tag">ID #{{ s.idSede }}</div>
                </div>

                <!-- Contenido de la Tarjeta -->
                <div class="card-body">
                  <h3 class="sede-title">{{ s.nombre }}</h3>

                  <div class="sede-address">
                    <app-icon name="truck" [size]="16"></app-icon>
                    <span>{{ s.direccion }}</span>
                  </div>

                  <!-- Responsable -->
                  <div class="responsable-box">
                    <div class="avatar-circle">
                      {{ obtenerIniciales(s.nombreResponsable) }}
                    </div>
                    <div class="responsable-details">
                      <span class="resp-label">Encargado de Sede</span>
                      <strong class="resp-name">{{ s.nombreResponsable || 'Sin responsable asignado' }}</strong>
                      @if (s.correoResponsable) {
                        <small class="resp-email">{{ s.correoResponsable }}</small>
                      }
                    </div>
                  </div>

                  <!-- Métricas / Badges de la sede -->
                  <div class="sede-badges">
                    <span class="metric-badge" title="Almacenes en esta sede">
                      <app-icon name="inventory" [size]="15"></app-icon>
                      <strong>{{ s.totalAlmacenes }}</strong> almacenes
                    </span>
                    <span class="metric-badge" title="Usuarios asignados">
                      <app-icon name="users" [size]="15"></app-icon>
                      <strong>{{ s.totalUsuarios }}</strong> usuarios
                    </span>
                  </div>

                  <!-- Acciones -->
                  <div class="card-actions">
                    <button type="button" class="btn-action edit" (click)="abrirModalEditar(s)" title="Editar información">
                      <app-icon name="wrench" [size]="15"></app-icon>
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      class="btn-action toggle"
                      [class.danger-text]="s.activo"
                      (click)="alternarEstado(s)"
                      [title]="s.activo ? 'Desactivar sede' : 'Activar sede'"
                    >
                      <app-icon [name]="s.activo ? 'alert' : 'check-circle'" [size]="15"></app-icon>
                      <span>{{ s.activo ? 'Desactivar' : 'Activar' }}</span>
                    </button>
                    <button
                      type="button"
                      class="btn-action delete"
                      [disabled]="s.totalAlmacenes > 0 || s.totalUsuarios > 0"
                      (click)="eliminarSede(s)"
                      title="Eliminar sede (Solo si no tiene registros vinculados)"
                    >
                      <app-icon name="alert" [size]="15"></app-icon>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="content-card empty-card">
            <app-icon name="warehouse" [size]="48"></app-icon>
            <h3>No se encontraron sedes</h3>
            <p>No hay sedes que coincidan con los filtros de búsqueda actuales.</p>
            <button type="button" class="btn-secondary" (click)="limpiarFiltros()">Limpiar filtros</button>
          </div>
        }
      }

      <!-- VISTA EN TABLA TRADICIONAL -->
      @if (viewMode() === 'table') {
        <div class="content-card">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre de Sede</th>
                  <th>Dirección</th>
                  <th>Responsable</th>
                  <th>Almacenes</th>
                  <th>Usuarios</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (s of sedesFiltradas(); track s.idSede) {
                  <tr>
                    <td><strong>#{{ s.idSede }}</strong></td>
                    <td>
                      <div class="table-sede-info">
                        <img [src]="obtenerFotoSede(s)" class="mini-thumb" alt="" />
                        <strong>{{ s.nombre }}</strong>
                      </div>
                    </td>
                    <td>{{ s.direccion }}</td>
                    <td>{{ s.nombreResponsable || '-' }}</td>
                    <td><span class="badge">{{ s.totalAlmacenes }}</span></td>
                    <td><span class="badge">{{ s.totalUsuarios }}</span></td>
                    <td>
                      <span class="badge" [class.off]="!s.activo">
                        {{ s.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="row-actions">
                      <button type="button" (click)="abrirModalEditar(s)">Editar</button>
                      <button type="button" (click)="alternarEstado(s)">
                        {{ s.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                      @if (s.totalAlmacenes === 0 && s.totalUsuarios === 0) {
                        <button type="button" class="danger" (click)="eliminarSede(s)">Eliminar</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="text-center">No hay sedes registradas.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    }

    <!-- MODAL DE CREACIÓN / EDICIÓN CON PREVIEW DE FOTO -->
    @if (mostrarModal()) {
      <div class="modal-backdrop" (click)="cerrarModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editandoId() === null ? 'Registrar Nueva Sede' : 'Editar Sede' }}</h3>
            <button type="button" class="close-btn" (click)="cerrarModal()">✕</button>
          </div>

          <form #f="ngForm" (ngSubmit)="guardarSede()">
            <div class="modal-body">
              <!-- Gestión y Previsualización de Fotografías: Imagen que Hay vs Imagen que se Subirá -->
              <div class="photo-dual-section">
                <div class="photo-section-header">
                  <span class="photo-section-title">Fotografía de la Sede</span>
                  <span class="photo-section-hint">Previsualización comparativa: imagen actual vs imagen a subir</span>
                </div>

                <div class="photo-dual-grid">
                  <!-- TARJETA 1: PREVISUALIZACIÓN DE LA IMAGEN QUE HAY (Actual o Por defecto) -->
                  <div class="photo-card current-photo-card">
                    <div class="photo-card-top">
                      <span class="photo-chip chip-current">
                        {{ editandoId() ? 'Imagen Actual' : 'Portada por Defecto' }}
                      </span>
                    </div>
                    <div class="photo-media-box">
                      <img [src]="fotoActualModal()" alt="Imagen actual de la sede" class="photo-img-fit" />
                      <div class="photo-media-caption">
                        <span>{{ editandoId() ? 'Registrada en sistema' : 'Se asignará si no subes otra' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- TARJETA 2: PREVISUALIZACIÓN DE LA IMAGEN QUE SE SUBIRÁ O ZONA DROPZONE -->
                  <div class="photo-card upload-photo-card">
                    @if (nuevaFotoPreview()) {
                      <!-- Previsualización de la nueva imagen que se subirá -->
                      <div class="new-photo-container">
                        <div class="photo-card-top">
                          <span class="photo-chip chip-new">Nueva imagen a subir</span>
                          <button type="button" class="btn-discard-photo" (click)="quitarNuevaFoto()" title="Descartar y conservar la imagen actual">✕ Descartar</button>
                        </div>
                        <div class="photo-media-box">
                          <img [src]="nuevaFotoPreview()" alt="Nueva foto que se subirá" class="photo-img-fit" />
                          <div class="photo-badge-ready">
                            <span>Lista para guardar</span>
                          </div>
                        </div>
                        <div class="new-photo-meta">
                          <span class="meta-name" [title]="nuevaFotoNombre()">{{ nuevaFotoNombre() }}</span>
                          <span class="meta-size">{{ nuevaFotoTamano() }}</span>
                        </div>
                        <button type="button" class="btn-change-photo" (click)="fileInput.click()">
                          Cambiar imagen
                        </button>
                      </div>
                    } @else {
                      <!-- Zona Dropzone para arrastrar o subir la nueva foto -->
                      <div class="dropzone-box"
                           [class.dragover]="isDragging()"
                           (dragover)="onDragOver($event)"
                           (dragleave)="onDragLeave($event)"
                           (drop)="onDrop($event)"
                           (click)="fileInput.click()">
                        <div class="photo-card-top">
                          <span class="photo-chip chip-ready">Subir nueva foto</span>
                        </div>
                        <div class="dropzone-body">
                          <div class="upload-icon-circle">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                          </div>
                          <strong class="drop-action-text">Arrastra la imagen aquí</strong>
                          <p class="drop-sub-text">o <span class="browse-action">haz clic para examinar</span></p>
                          <span class="drop-specs-text">JPG, PNG o WEBP (máx. 5MB)</span>
                        </div>
                      </div>
                    }
                    <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" (change)="onFileSelected($event)" hidden />
                  </div>
                </div>
              </div>

              <div class="form-grid">
                <label>
                  Nombre de la Sede *
                  <input
                    type="text"
                    name="nombre"
                    required
                    minlength="2"
                    maxlength="100"
                    placeholder="Ej. Centro de Distribución Sur - Lurín"
                    [(ngModel)]="form.nombre"
                    #nombreCtrl="ngModel"
                  />
                  @if (nombreCtrl.invalid && nombreCtrl.touched) {
                    <small class="field-error">El nombre es obligatorio (mínimo 2 caracteres).</small>
                  }
                </label>

                <label>
                  Dirección Física *
                  <input
                    type="text"
                    name="direccion"
                    required
                    minlength="3"
                    maxlength="255"
                    placeholder="Ej. Av. Antigua Panamericana Sur Km 35"
                    [(ngModel)]="form.direccion"
                    #dirCtrl="ngModel"
                  />
                  @if (dirCtrl.invalid && dirCtrl.touched) {
                    <small class="field-error">La dirección es obligatoria.</small>
                  }
                </label>

                <label>
                  Responsable / Encargado de Sede
                  <select name="idResponsable" [(ngModel)]="form.idResponsable">
                    <option [ngValue]="null">-- Sin responsable asignado --</option>
                    @for (r of responsables(); track r.idUsuario) {
                      <option [ngValue]="r.idUsuario">
                        {{ r.nombreCompleto }} ({{ r.rol }})
                      </option>
                    }
                  </select>
                </label>

                <div class="checkbox-group">
                  <label class="custom-checkbox">
                    <input type="checkbox" name="activo" [(ngModel)]="form.activo" />
                    <span>Sede operativa y activa</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="f.invalid || guardando()">
                @if (guardando()) {
                  <span>Guardando...</span>
                } @else {
                  <span>{{ editandoId() === null ? 'Crear Sede' : 'Actualizar Sede' }}</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    /* ── STATS CARDS ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: #ffffff;
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }

    .icon-hub { background: linear-gradient(135deg, #0b1120 0%, #1e293b 100%); }
    .icon-active { background: linear-gradient(135deg, #16a34a 0%, #18d600 100%); }
    .icon-almacenes { background: linear-gradient(135deg, #2563eb 0%, #38bdf8 100%); }
    .icon-usuarios { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
    }

    .stat-label {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
      margin-top: 2px;
    }

    /* ── TOOLBAR ── */
    .toolbar-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 0.5rem 0.85rem;
      flex: 1;
      max-width: 400px;
      color: #64748b;
    }

    .search-box input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 14px;
      color: #0f172a;
    }

    .filters-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .filters-group select {
      padding: 0.55rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      font-size: 14px;
      background: #ffffff;
      color: #334155;
      font-weight: 500;
    }

    .view-toggle {
      display: flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 9px;
      gap: 3px;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: none;
      background: transparent;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toggle-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    /* ── GRID DE TARJETAS ── */
    .sedes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .sede-card {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      transition: transform 0.25s, box-shadow 0.25s;
    }

    .sede-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
    }

    .sede-card.inactive {
      opacity: 0.75;
      border-style: dashed;
    }

    .card-cover {
      position: relative;
      height: 160px;
      background: #0b1120;
      overflow: hidden;
    }

    .cover-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .sede-card:hover .cover-image {
      transform: scale(1.05);
    }

    .cover-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(11, 17, 32, 0.2) 0%, rgba(11, 17, 32, 0.8) 100%);
    }

    .status-pill {
      position: absolute;
      top: 12px;
      right: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(239, 68, 68, 0.85);
      color: #ffffff;
      backdrop-filter: blur(8px);
    }

    .status-pill.active {
      background: rgba(24, 214, 0, 0.9);
      color: #052e16;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }

    .sede-id-tag {
      position: absolute;
      bottom: 12px;
      left: 14px;
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
      background: rgba(0, 0, 0, 0.55);
      padding: 2px 8px;
      border-radius: 6px;
      backdrop-filter: blur(6px);
      letter-spacing: 0.5px;
    }

    .card-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .sede-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px;
      line-height: 1.3;
    }

    .sede-address {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.4;
      margin-bottom: 1rem;
    }

    .sede-address app-icon {
      flex-shrink: 0;
      margin-top: 1px;
      color: #94a3b8;
    }

    /* Responsable */
    .responsable-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 1rem;
      border: 1px solid #f1f5f9;
    }

    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #0b1120;
      color: #18d600;
      font-weight: 800;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .responsable-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .resp-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.04em;
    }

    .resp-name {
      font-size: 13px;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .resp-email {
      font-size: 11px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Badges */
    .sede-badges {
      display: flex;
      gap: 8px;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }

    .metric-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      background: #f1f5f9;
      color: #334155;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
    }

    .metric-badge strong {
      color: #0f172a;
    }

    /* Acciones */
    .card-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
      border-top: 1px solid #f1f5f9;
      padding-top: 1rem;
    }

    .btn-action {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 12px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-action:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .btn-action.toggle.danger-text:hover {
      color: #dc2626;
      border-color: #fca5a5;
      background: #fef2f2;
    }

    .btn-action.delete {
      flex: 0 0 36px;
      padding: 0;
      color: #dc2626;
      border-color: #fee2e2;
    }

    .btn-action.delete:hover:not(:disabled) {
      background: #fee2e2;
      border-color: #fca5a5;
    }

    .btn-action.delete:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    /* Tabla */
    .table-sede-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .mini-thumb {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      object-fit: cover;
    }

    /* Loading & Empty */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
      color: #64748b;
    }

    .empty-card {
      text-align: center;
      padding: 4rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: #64748b;
    }

    .empty-card h3 {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(11, 17, 32, 0.75);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.2s ease;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 20px;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 18px;
      color: #94a3b8;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    /* Sección dual de previsualización de fotografías */
    .photo-dual-section {
      margin-bottom: 1.25rem;
    }

    .photo-section-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }

    .photo-section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }

    .photo-section-hint {
      font-size: 11px;
      color: #64748b;
    }

    .photo-dual-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      align-items: stretch;
    }

    @media (max-width: 520px) {
      .photo-dual-grid {
        grid-template-columns: 1fr;
      }
    }

    .photo-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #ffffff;
      padding: 10px;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .current-photo-card {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .upload-photo-card {
      background: #ffffff;
    }

    .photo-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      min-height: 22px;
    }

    .photo-chip {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
    }

    .chip-current {
      background: #e2e8f0;
      color: #334155;
    }

    .chip-new {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .chip-ready {
      background: #f1f5f9;
      color: #475569;
    }

    .photo-media-box {
      position: relative;
      width: 100%;
      height: 125px;
      border-radius: 8px;
      overflow: hidden;
      background: #0f172a;
    }

    .photo-img-fit {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .photo-media-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent);
      padding: 4px 8px;
      color: #ffffff;
      font-size: 10px;
      font-weight: 500;
    }

    .photo-badge-ready {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(24, 214, 0, 0.5);
      color: #ffffff;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .btn-discard-photo {
      background: transparent;
      border: 1px solid #fecaca;
      color: #dc2626;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-discard-photo:hover {
      background: #fee2e2;
    }

    .new-photo-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .new-photo-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
      font-size: 11px;
    }

    .meta-name {
      color: #1e293b;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 130px;
    }

    .meta-size {
      color: #64748b;
      font-size: 10px;
    }

    .btn-change-photo {
      margin-top: 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px;
      font-size: 11px;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      width: 100%;
      transition: background 0.2s;
    }

    .btn-change-photo:hover {
      background: #e2e8f0;
    }

    /* Dropzone dentro de la tarjeta derecha */
    .dropzone-box {
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      background: #f8fafc;
      padding: 6px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .dropzone-box:hover, .dropzone-box.dragover {
      border-color: var(--primary-color, #18d600);
      background: #f0fdf4;
      box-shadow: 0 0 0 2px rgba(24, 214, 0, 0.15);
    }

    .dropzone-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px 4px 6px;
    }

    .upload-icon-circle {
      color: #64748b;
      margin-bottom: 4px;
      transition: all 0.2s;
    }

    .dropzone-box:hover .upload-icon-circle {
      color: var(--primary-color, #18d600);
      transform: translateY(-2px);
    }

    .drop-action-text {
      font-size: 12px;
      color: #1e293b;
      font-weight: 600;
      margin: 0;
    }

    .drop-sub-text {
      font-size: 11px;
      color: #64748b;
      margin: 2px 0 0 0;
    }

    .browse-action {
      color: #0284c7;
      text-decoration: underline;
      font-weight: 600;
    }

    .drop-specs-text {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 4px;
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-grid label {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }

    .form-grid input, .form-grid select {
      padding: 0.65rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      font-size: 14px;
      color: #0f172a;
    }

    .field-error {
      color: #dc2626;
      font-size: 11px;
      font-weight: 500;
    }

    .custom-checkbox {
      flex-direction: row !important;
      align-items: center;
      gap: 8px !important;
      cursor: pointer;
      user-select: none;
    }

    .custom-checkbox input {
      width: 18px;
      height: 18px;
      accent-color: #18d600;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background: #f8fafc;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class SedesPageComponent implements OnInit {
  private service = inject(SedesService);
  private storageService = inject(SupabaseStorageService);

  sedes = signal<Sede[]>([]);
  responsables = signal<ResponsableSede[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');

  busqueda = '';
  filtroEstado = 'todos';
  viewMode = signal<'grid' | 'table'>('grid');

  mostrarModal = signal(false);
  editandoId = signal<number | null>(null);
  isDragging = signal(false);

  fotoPlaceholder = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';
  formFotoUrl = '';

  // Previsualizaciones de fotografía: imagen que hay vs imagen que se subirá
  fotoActualModal = signal<string>('');
  nuevaFotoPreview = signal<string>('');
  nuevaFotoNombre = signal<string>('');
  nuevaFotoTamano = signal<string>('');

  form: SedeRequest = {
    nombre: '',
    direccion: '',
    idResponsable: null,
    activo: true,
  };

  // Fotos de almacenes/sedes para rotar según el ID de la sede
  private fallbackPhotos = [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565891741441-64926e441838?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80'
  ];

  // Map local para recordar fotos asignadas
  private photoCache = new Map<number, string>();

  sedesActivasCount = computed(() => this.sedes().filter(s => s.activo).length);
  totalAlmacenesCount = computed(() => this.sedes().reduce((acc, s) => acc + (s.totalAlmacenes || 0), 0));
  totalUsuariosCount = computed(() => this.sedes().reduce((acc, s) => acc + (s.totalUsuarios || 0), 0));

  sedesFiltradas = computed(() => {
    let list = this.sedes();

    if (this.filtroEstado === 'activos') {
      list = list.filter(s => s.activo);
    } else if (this.filtroEstado === 'inactivos') {
      list = list.filter(s => !s.activo);
    }

    const q = this.busqueda.trim().toLowerCase();
    if (q) {
      list = list.filter(s =>
        s.nombre.toLowerCase().includes(q) ||
        s.direccion.toLowerCase().includes(q) ||
        (s.nombreResponsable && s.nombreResponsable.toLowerCase().includes(q))
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.service.listar(false).subscribe({
      next: (data) => {
        this.sedes.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudieron cargar las sedes');
      }
    });

    this.service.responsables().subscribe({
      next: (data) => this.responsables.set(data),
      error: (err) => console.warn('No se pudieron cargar los responsables de sede', err)
    });
  }

  obtenerFotoSede(sede: Sede): string {
    if (sede.fotoUrl) return sede.fotoUrl;
    if (this.photoCache.has(sede.idSede)) return this.photoCache.get(sede.idSede)!;
    
    // Asignar una foto consistente por ID
    const index = Math.abs(sede.idSede) % this.fallbackPhotos.length;
    const photo = this.fallbackPhotos[index];
    this.photoCache.set(sede.idSede, photo);
    return photo;
  }

  obtenerIniciales(nombre: string | null): string {
    if (!nombre) return 'SD';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  abrirModalCrear(): void {
    this.limpiarAvisos();
    this.editandoId.set(null);
    this.formFotoUrl = '';
    this.fotoActualModal.set(this.fotoPlaceholder);
    this.nuevaFotoPreview.set('');
    this.nuevaFotoNombre.set('');
    this.nuevaFotoTamano.set('');
    this.form = {
      nombre: '',
      direccion: '',
      idResponsable: null,
      activo: true,
      fotoUrl: '',
    };
    this.mostrarModal.set(true);
  }

  abrirModalEditar(sede: Sede): void {
    this.limpiarAvisos();
    this.editandoId.set(sede.idSede);
    const fotoActual = this.obtenerFotoSede(sede);
    this.fotoActualModal.set(fotoActual);
    this.formFotoUrl = sede.fotoUrl || this.photoCache.get(sede.idSede) || '';
    this.nuevaFotoPreview.set('');
    this.nuevaFotoNombre.set('');
    this.nuevaFotoTamano.set('');
    this.form = {
      nombre: sede.nombre,
      direccion: sede.direccion,
      idResponsable: sede.idResponsable,
      activo: sede.activo,
      fotoUrl: sede.fotoUrl || '',
    };
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.editandoId.set(null);
    this.isDragging.set(false);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      await this.procesarArchivo(event.dataTransfer.files[0]);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      await this.procesarArchivo(input.files[0]);
    }
  }

  async procesarArchivo(file: File): Promise<void> {
    try {
      this.nuevaFotoNombre.set(file.name);
      const tamano = file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
        : (file.size / 1024).toFixed(1) + ' KB';
      this.nuevaFotoTamano.set(tamano);

      const url = await this.storageService.subirArchivo(file, 'sedes');
      this.nuevaFotoPreview.set(url);
      this.formFotoUrl = url;
    } catch (err) {
      console.error('Error al procesar la foto de la sede:', err);
    }
  }

  quitarNuevaFoto(): void {
    this.nuevaFotoPreview.set('');
    this.nuevaFotoNombre.set('');
    this.nuevaFotoTamano.set('');
    this.formFotoUrl = this.editandoId() ? (this.fotoActualModal() || '') : '';
  }

  guardarSede(): void {
    this.limpiarAvisos();
    this.guardando.set(true);

    const fotoFinal = this.formFotoUrl || (this.editandoId() ? this.fotoActualModal() : this.fotoPlaceholder);
    this.form.fotoUrl = fotoFinal || undefined;

    const id = this.editandoId();
    if (id === null) {
      this.service.crear(this.form).subscribe({
        next: (nueva) => {
          if (fotoFinal) {
            this.photoCache.set(nueva.idSede, fotoFinal);
          }
          this.guardando.set(false);
          this.cerrarModal();
          this.mensaje.set(`Sede "${nueva.nombre}" registrada exitosamente.`);
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando.set(false);
          this.mostrarError(err, 'No se pudo crear la sede');
        }
      });
    } else {
      this.service.actualizar(id, this.form).subscribe({
        next: (act) => {
          if (fotoFinal) {
            this.photoCache.set(act.idSede, fotoFinal);
          }
          this.guardando.set(false);
          this.cerrarModal();
          this.mensaje.set(`Sede "${act.nombre}" actualizada exitosamente.`);
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando.set(false);
          this.mostrarError(err, 'No se pudo actualizar la sede');
        }
      });
    }
  }

  alternarEstado(sede: Sede): void {
    const nuevoEstado = !sede.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    if (!confirm(`¿Está seguro de que desea ${accion} la sede "${sede.nombre}"?`)) {
      return;
    }

    this.limpiarAvisos();
    this.service.cambiarEstado(sede.idSede, nuevoEstado).subscribe({
      next: (resp) => {
        this.mensaje.set(`La sede "${resp.nombre}" ahora está ${resp.activo ? 'activa' : 'inactiva'}.`);
        this.cargarDatos();
      },
      error: (err) => this.mostrarError(err, `No se pudo ${accion} la sede`)
    });
  }

  eliminarSede(sede: Sede): void {
    if (sede.totalAlmacenes > 0 || sede.totalUsuarios > 0) {
      alert('No se puede eliminar una sede que tiene almacenes o colaboradores vinculados.');
      return;
    }

    if (!confirm(`¿Desea eliminar definitivamente la sede "${sede.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.limpiarAvisos();
    this.service.eliminar(sede.idSede).subscribe({
      next: () => {
        this.mensaje.set(`Sede "${sede.nombre}" eliminada correctamente.`);
        this.cargarDatos();
      },
      error: (err) => this.mostrarError(err, 'No se pudo eliminar la sede')
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEstado = 'todos';
  }

  private limpiarAvisos(): void {
    this.mensaje.set('');
    this.error.set('');
  }

  private mostrarError(err: HttpErrorResponse, porDefecto: string): void {
    const detalle = err.error?.mensaje ?? err.error?.message;
    this.error.set(detalle ? `${porDefecto}: ${detalle}` : `${porDefecto} (HTTP ${err.status})`);
  }
}
