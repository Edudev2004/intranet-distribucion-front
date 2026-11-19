import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { EntregasService } from '../../services/entregas.service';
import { ActualizarEntregaRequest, Entrega, EstadoEntregaId } from '../../models/entrega.model';
import { SupabaseStorageService, EvidenciaPreset } from '../../../../core/services/supabase-storage.service';

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
  totalEntregas?: number;
}

@Component({
  selector: 'app-distribution-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, PageHeaderComponent],
  template: `
    <app-page-header
      title="Despachos & Seguimiento de Entregas"
      subtitle="Monitoreo de rutas en tiempo real y Prueba de Entrega Fotográfica (POD - RF-16)">
      @if (rutaSeleccionada()) {
        <button class="btn-secondary" (click)="deseleccionarRuta()">← Volver al listado de rutas</button>
      }
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">{{ mensaje() }}</div>
    }
    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    <!-- Vista 1: Listado de Rutas / Despachos -->
    @if (!rutaSeleccionada()) {
      <div class="content-card">
        <div class="card-header">
          <div>
            <h3>Programaciones de Rutas Asignadas</h3>
            <p class="subtitle">Seleccione una ruta para monitorear o gestionar sus entregas y evidencias</p>
          </div>
          <button class="btn-secondary" (click)="cargarAsignaciones()">↻ Actualizar</button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ruta</th>
                <th>Vehículo</th>
                <th>Conductor</th>
                <th>Salida Programada</th>
                <th>Estado</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @if (cargando) {
                <tr>
                  <td colspan="7">
                    <div class="loading-state">
                      <div class="spinner"></div>
                      <span>Cargando programaciones de ruta...</span>
                    </div>
                  </td>
                </tr>
              } @else if (asignaciones.length > 0) {
                @for (item of asignaciones; track item.idProgramacion) {
                  <tr class="clickable-row" (click)="seleccionarRuta(item)">
                    <td><strong>#{{ item.idProgramacion }}</strong></td>
                    <td>Ruta #{{ item.idRuta }}</td>
                    <td>Vehículo #{{ item.idVehiculo }}</td>
                    <td>Conductor #{{ item.idConductor }}</td>
                    <td>{{ item.inicioProgramado | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                      <span class="badge" [class.warn]="item.idEstadoProgramacion === 1" [class.success]="item.idEstadoProgramacion === 2">
                        {{ item.estadoProgramacion }}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <button class="btn-view" (click)="$event.stopPropagation(); seleccionarRuta(item)">
                        Ver Seguimiento & Entregas →
                      </button>
                    </td>
                  </tr>
                }
              } @else {
                <tr>
                  <td colspan="7" class="empty-state">
                    No hay asignaciones ni rutas programadas en este momento.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Vista 2: Seguimiento de Entregas & POD de la Ruta Seleccionada (RF-16) -->
    @if (rutaSeleccionada()) {
      <div class="route-banner">
        <div class="route-info">
          <span class="tag">Ruta Activa #{{ rutaSeleccionada()?.idProgramacion }}</span>
          <h2>Seguimiento de Entregas en Tiempo Real</h2>
          <p>
            Vehículo ID #{{ rutaSeleccionada()?.idVehiculo }} &bull;
            Conductor ID #{{ rutaSeleccionada()?.idConductor }} &bull;
            Salida: {{ rutaSeleccionada()?.inicioProgramado | date:'dd/MM/yyyy HH:mm' }}
          </p>
        </div>
        <div class="route-stats">
          <div class="stat-box">
            <span class="stat-num">{{ totalEntregas() }}</span>
            <span class="stat-label">Paradas Totales</span>
          </div>
          <div class="stat-box success">
            <span class="stat-num">{{ entregasCompletadas() }}</span>
            <span class="stat-label">Entregados (POD)</span>
          </div>
        </div>
      </div>

      <div class="content-card">
        <div class="card-header">
          <h3>Paradas y Prueba de Entrega (POD)</h3>
          <span class="badge-bucket">Supabase Bucket: evidencias-entregas</span>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Parada</th>
                <th>Pedido</th>
                <th>Cliente & Destino</th>
                <th>Hora Estimada</th>
                <th>Hora Real</th>
                <th>Estado</th>
                <th>Evidencia POD</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @if (cargandoEntregas()) {
                <tr>
                  <td colspan="8">
                    <div class="loading-state">
                      <div class="spinner"></div>
                      <span>Cargando entregas de la ruta...</span>
                    </div>
                  </td>
                </tr>
              } @else if (entregas().length > 0) {
                @for (e of entregas(); track e.idEntrega) {
                  <tr>
                    <td>
                      <div class="stop-badge">
                        #{{ e.ordenVisita ?? ($index + 1) }}
                      </div>
                    </td>
                    <td><strong>Pedido #{{ e.idPedido }}</strong></td>
                    <td>
                      <div class="client-cell">
                        <span class="client-name">{{ e.cliente ?? 'Cliente asignado' }}</span>
                        <span class="client-address">{{ e.direccionCliente ?? 'Dirección registrada' }}</span>
                      </div>
                    </td>
                    <td>{{ (e.horaEstimada | date:'HH:mm') ?? '--:--' }}</td>
                    <td>
                      @if (e.horaEntregaReal) {
                        <span class="real-time">✓ {{ e.horaEntregaReal | date:'HH:mm' }}</span>
                      } @else {
                        <span class="text-muted">Pendiente</span>
                      }
                    </td>
                    <td>
                      <span class="badge"
                        [class.pending]="e.idEstadoEntrega === 1"
                        [class.in-route]="e.idEstadoEntrega === 2"
                        [class.delivered]="e.idEstadoEntrega === 3"
                        [class.failed]="e.idEstadoEntrega === 4">
                        {{ e.estadoEntrega }}
                      </span>
                    </td>
                    <td>
                      @if (e.fotoEntregaUrl || e.fotoGuiaUrl) {
                        <div class="pod-thumbnails">
                          @if (e.fotoEntregaUrl) {
                            <div class="thumb-preview-box" (click)="verFoto(e.fotoEntregaUrl, 'Foto del Paquete Entregado', e)" title="Ver fotografía del paquete">
                              <img [src]="e.fotoEntregaUrl" alt="Foto paquete" class="mini-thumb-img" (error)="onThumbError($event)" />
                              <span class="mini-thumb-label">Paquete</span>
                            </div>
                          }
                          @if (e.fotoGuiaUrl) {
                            <div class="thumb-preview-box" (click)="verFoto(e.fotoGuiaUrl, 'Guía de Remisión Sellada', e)" title="Ver fotografía de la guía">
                              <img [src]="e.fotoGuiaUrl" alt="Foto guía" class="mini-thumb-img" (error)="onThumbError($event)" />
                              <span class="mini-thumb-label">Guía</span>
                            </div>
                          }
                        </div>
                      } @else {
                        <span class="no-pod">Sin evidencias</span>
                      }
                    </td>
                    <td style="text-align: right;">
                      <div class="action-buttons">
                        @if (e.idEstadoEntrega !== 3) {
                          @if (e.idEstadoEntrega !== 2) {
                            <button class="btn-action route" (click)="marcarEnRuta(e)" title="Marcar En Camino">
                              En Camino
                            </button>
                          }
                          <button class="btn-action deliver" (click)="abrirModalPOD(e)" title="Registrar Prueba de Entrega">
                            Entregado
                          </button>
                        } @else {
                          <span class="badge-done">✓ Conforme</span>
                        }
                        <button class="btn-action alert" (click)="reportarIncidencia(e)" title="Reportar Incidencia">
                          Incidencia
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              } @else {
                <tr>
                  <td colspan="8" class="empty-state">
                    No hay entregas asignadas a esta programación de ruta.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Modal de Prueba de Entrega Fotográfica (POD) -->
    @if (modalPODVisible() && entregaSeleccionada()) {
      <div class="modal-backdrop" (click)="cerrarModalPOD()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Registrar Prueba de Entrega Fotográfica (POD)</h3>
              <p>Entrega #{{ entregaSeleccionada()?.idEntrega }} &bull; Pedido #{{ entregaSeleccionada()?.idPedido }}</p>
            </div>
            <button class="btn-close" (click)="cerrarModalPOD()">✕</button>
          </div>

          <div class="modal-body">
            <div class="alert info">
              Al confirmar, el sistema registrará automáticamente la hora exacta de entrega y almacenará las evidencias en el bucket <strong>evidencias-entregas</strong>.
            </div>

            <!-- Evidencia 1: Foto del Paquete Recibido -->
            <div class="evidence-card">
              <label class="evidence-header">
                <strong>1. Foto del Paquete Entregado</strong> (Puerta / Local del cliente)
              </label>
              <div class="upload-controls">
                <input type="file" accept="image/*" (change)="onArchivoPaquete($event)" id="filePaquete" class="file-input" />
                <label for="filePaquete" class="file-btn">Subir fotografía del paquete</label>
              </div>
              <div class="presets-row">
                <span class="preset-title">Preset rápido:</span>
                <button type="button" class="btn-preset" (click)="podForm.fotoEntregaUrl = presetPaquete">
                  Usar foto de paquete en recepción
                </button>
              </div>
              @if (podForm.fotoEntregaUrl) {
                <div class="preview-box">
                  <img [src]="podForm.fotoEntregaUrl" alt="Foto paquete" />
                  <button type="button" class="btn-clear" (click)="podForm.fotoEntregaUrl = ''">✕</button>
                </div>
              }
            </div>

            <!-- Evidencia 2: Foto de la Guía de Remisión Sellada -->
            <div class="evidence-card">
              <label class="evidence-header">
                <strong>2. Foto de la Guía de Remisión Física</strong> (Sello y firma del cliente)
              </label>
              <div class="upload-controls">
                <input type="file" accept="image/*" (change)="onArchivoGuia($event)" id="fileGuia" class="file-input" />
                <label for="fileGuia" class="file-btn">Subir fotografía de la guía firmada</label>
              </div>
              <div class="presets-row">
                <span class="preset-title">Preset rápido:</span>
                <button type="button" class="btn-preset" (click)="podForm.fotoGuiaUrl = presetGuia">
                  Usar foto de guía sellada
                </button>
              </div>
              @if (podForm.fotoGuiaUrl) {
                <div class="preview-box">
                  <img [src]="podForm.fotoGuiaUrl" alt="Foto guía" />
                  <button type="button" class="btn-clear" (click)="podForm.fotoGuiaUrl = ''">✕</button>
                </div>
              }
            </div>

            <div class="form-group">
              <label>Receptor / Observaciones de Conformidad</label>
              <input type="text" [(ngModel)]="podForm.notas" placeholder="Ej: Recibido por Juan Pérez - DNI 45892134 conforme" class="text-input" />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="cerrarModalPOD()">Cancelar</button>
            <button class="btn-primary" (click)="confirmarEntrega()" [disabled]="guardandoPOD()">
              {{ guardandoPOD() ? 'Guardando POD...' : '✓ Confirmar Entrega Conforme' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Lightbox de Foto de Evidencia -->
    @if (modalFotoVisible()) {
      <div class="modal-backdrop" (click)="cerrarModalFoto()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>{{ fotoTitulo() }}</h3>
              <p>Entrega #{{ fotoEntregaContexto()?.idEntrega }} &bull; Pedido #{{ fotoEntregaContexto()?.idPedido }}</p>
            </div>
            <button class="btn-close" (click)="cerrarModalFoto()">✕</button>
          </div>
          <div class="modal-body text-center">
            <img [src]="fotoUrl()" alt="Evidencia POD" class="full-img" />
            @if (fotoEntregaContexto()?.notas) {
              <div class="pod-note">
                <strong>Recepción:</strong> {{ fotoEntregaContexto()?.notas }}
              </div>
            }
          </div>
          <div class="modal-footer">
            <a [href]="fotoUrl()" target="_blank" class="btn-secondary">Abrir en pestaña nueva ↗</a>
            <button class="btn-primary" (click)="cerrarModalFoto()">Cerrar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .content-card { background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-header h3 { margin: 0; font-size: 1.15rem; color: #0f172a; }
    .subtitle { margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.85rem; }
    .badge-bucket { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: 600; }
    
    .table-wrap { overflow-x: auto; contain: inline-size; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; vertical-align: middle; }
    .data-table th { color: #475569; background: #f8fafc; font-weight: 600; white-space: nowrap; }
    
    .clickable-row { cursor: pointer; transition: background 0.15s ease; }
    .clickable-row:hover { background: #f8fafc; }
    
    .btn-primary { padding: 0.55rem 1.1rem; background: var(--primary-color, #18d600); color: #052e16; border: none; border-radius: 9px; box-shadow: 0 4px 12px var(--primary-glow); font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-secondary { padding: 0.5rem 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 9px; color: #334155; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-view { background: #f1f5f9; border: 1px solid #cbd5e1; color: #0284c7; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
    .btn-view:hover { background: #e0f2fe; border-color: #7dd3fc; }

    /* Badges */
    .badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
    .badge.warn, .badge.pending { background: #fef3c7; color: #92400e; }
    .badge.in-route { background: #e0f2fe; color: #0369a1; }
    .badge.success, .badge.delivered { background: #dcfce7; color: #166534; }
    .badge.failed { background: #fee2e2; color: #991b1b; }
    .badge-done { color: #16a34a; font-weight: 600; font-size: 0.85rem; }

    /* Route Banner */
    .route-banner { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #f8fafc; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .tag { display: inline-block; background: #1e293b; color: #38bdf8; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600; margin-bottom: 0.35rem; }
    .route-info h2 { margin: 0; font-size: 1.4rem; color: #ffffff; }
    .route-info p { margin: 0.25rem 0 0 0; color: #94a3b8; font-size: 0.85rem; }
    .route-stats { display: flex; gap: 1rem; }
    .stat-box { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem 1.25rem; text-align: center; }
    .stat-box.success { border-color: rgba(24, 214, 0, 0.3); background: rgba(24, 214, 0, 0.08); }
    .stat-num { display: block; font-size: 1.5rem; font-weight: 700; color: #fff; }
    .stat-box.success .stat-num { color: #4ade80; }
    .stat-label { font-size: 0.75rem; color: #94a3b8; }

    /* Stops and POD cells */
    .stop-badge { width: 32px; height: 32px; border-radius: 50%; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; }
    .client-cell { display: flex; flex-direction: column; gap: 0.15rem; }
    .client-name { font-weight: 600; color: #0f172a; }
    .client-address { font-size: 0.8rem; color: #64748b; }
    .real-time { color: #166534; font-weight: 600; }
    .text-muted { color: #94a3b8; font-size: 0.8rem; }
    
    .pod-thumbnails { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
    .thumb-preview-box { display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; padding: 3px; border-radius: 6px; background: #ffffff; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06); transition: all 0.2s ease; }
    .thumb-preview-box:hover { transform: translateY(-2px); border-color: var(--primary-color, #18d600); box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12); }
    .mini-thumb-img { width: 44px; height: 32px; border-radius: 4px; object-fit: cover; display: block; background: #0f172a; }
    .mini-thumb-label { font-size: 10px; font-weight: 600; color: #334155; line-height: 1; }
    .no-pod { font-size: 0.8rem; color: #94a3b8; }

    /* Action buttons */
    .action-buttons { display: flex; gap: 0.35rem; justify-content: flex-end; align-items: center; }
    .btn-action { padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; border: none; cursor: pointer; white-space: nowrap; }
    .btn-action.route { background: #e0f2fe; color: #0369a1; }
    .btn-action.deliver { background: var(--primary-color, #18d600); color: #052e16; }
    .btn-action.alert { background: #fee2e2; color: #991b1b; }
    .btn-action:hover { opacity: 0.88; }

    /* Alerts */
    .alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert.ok { background: #dcfce7; color: #166534; }
    .alert.err { background: #fee2e2; color: #991b1b; }
    .alert.info { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 0.85rem; }

    /* Modal POD & Lightbox */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1rem; backdrop-filter: blur(4px); }
    .modal-content { background: #ffffff; border-radius: 12px; max-width: 650px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); }
    .modal-header { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; }
    .modal-header h3 { margin: 0; font-size: 1.15rem; color: #0f172a; }
    .modal-header p { margin: 0.2rem 0 0 0; font-size: 0.8rem; color: #64748b; }
    .btn-close { background: transparent; border: none; font-size: 1.25rem; cursor: pointer; color: #64748b; }
    .modal-body { padding: 1.25rem; }
    .modal-footer { padding: 1rem 1.25rem; display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #e2e8f0; }

    .evidence-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.9rem; margin-bottom: 1rem; }
    .evidence-header { display: block; margin-bottom: 0.4rem; font-size: 0.85rem; color: #1e293b; }
    .upload-controls { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .file-input { display: none; }
    .file-btn { background: #ffffff; border: 1px solid #cbd5e1; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; color: #334155; cursor: pointer; }
    .file-btn:hover { background: #f1f5f9; }
    .url-field { flex: 1; min-width: 200px; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem; font-family: inherit; }
    .presets-row { display: flex; gap: 0.4rem; align-items: center; margin-top: 0.4rem; }
    .preset-title { font-size: 0.75rem; color: #64748b; }
    .btn-preset { font-size: 0.75rem; padding: 0.15rem 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; cursor: pointer; color: #0369a1; }
    .btn-preset:hover { background: #e0f2fe; }

    .preview-box { position: relative; width: 120px; height: 90px; margin-top: 0.5rem; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1; }
    .preview-box img { width: 100%; height: 100%; object-fit: cover; }
    .btn-clear { position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 0.7rem; }

    .form-group { display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.75rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #334155; }
    .text-input { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-family: inherit; }

    .full-img { max-width: 100%; max-height: 420px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; }
    .pod-note { margin-top: 0.75rem; padding: 0.5rem; background: #f1f5f9; border-radius: 6px; font-size: 0.85rem; color: #334155; text-align: left; }
    .text-center { text-align: center; }
  `]
})
export class DistributionListPage implements OnInit {
  private http = inject(HttpClient);
  private entregasService = inject(EntregasService);
  private storageService = inject(SupabaseStorageService);
  private router = inject(Router);

  asignaciones: ProgramacionRuta[] = [];
  cargando = false;
  mensaje = signal('');
  error = signal('');

  // Vista de entregas de una ruta
  rutaSeleccionada = signal<ProgramacionRuta | null>(null);
  entregas = signal<Entrega[]>([]);
  cargandoEntregas = signal(false);

  // Modal POD
  modalPODVisible = signal(false);
  entregaSeleccionada = signal<Entrega | null>(null);
  guardandoPOD = signal(false);
  podForm = {
    fotoEntregaUrl: '',
    fotoGuiaUrl: '',
    notas: ''
  };

  // Modal Lightbox
  modalFotoVisible = signal(false);
  fotoUrl = signal('');
  fotoTitulo = signal('');
  fotoEntregaContexto = signal<Entrega | null>(null);

  // Presets para testing
  readonly presetPaquete = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80';
  readonly presetGuia = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';

  ngOnInit() {
    this.cargarAsignaciones();
  }

  cargarAsignaciones() {
    this.cargando = true;
    this.error.set('');
    this.http.get<ProgramacionRuta[]>('http://localhost:8080/api/v1/programacion-rutas').subscribe({
      next: (data) => {
        this.asignaciones = data ?? [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar las programaciones de ruta:', err);
        this.error.set('No se pudieron cargar las programaciones de rutas');
        this.cargando = false;
      }
    });
  }

  seleccionarRuta(ruta: ProgramacionRuta) {
    this.rutaSeleccionada.set(ruta);
    this.cargarEntregas(ruta.idProgramacion);
  }

  deseleccionarRuta() {
    this.rutaSeleccionada.set(null);
    this.entregas.set([]);
    this.limpiarAvisos();
  }

  cargarEntregas(idProgramacion: number) {
    this.cargandoEntregas.set(true);
    this.entregasService.listarPorProgramacion(idProgramacion).subscribe({
      next: (data) => {
        this.entregas.set(data ?? []);
        this.cargandoEntregas.set(false);
      },
      error: (err) => {
        console.error('Error al cargar entregas:', err);
        this.cargandoEntregas.set(false);
        this.error.set('No se pudieron obtener las entregas de esta ruta');
      }
    });
  }

  totalEntregas(): number {
    return this.entregas().length;
  }

  entregasCompletadas(): number {
    return this.entregas().filter(e => e.idEstadoEntrega === EstadoEntregaId.ENTREGADO).length;
  }

  marcarEnRuta(entrega: Entrega) {
    this.limpiarAvisos();
    const req: ActualizarEntregaRequest = {
      idEstadoEntrega: EstadoEntregaId.EN_RUTA
    };
    this.entregasService.actualizarEstado(entrega.idEntrega, req).subscribe({
      next: () => {
        this.mensaje.set(`Entrega #${entrega.idEntrega} marcada como En Camino.`);
        if (this.rutaSeleccionada()) {
          this.cargarEntregas(this.rutaSeleccionada()!.idProgramacion);
        }
      },
      error: (err) => {
        this.error.set('Error al actualizar el estado de la entrega');
      }
    });
  }

  abrirModalPOD(entrega: Entrega) {
    this.entregaSeleccionada.set(entrega);
    this.podForm = {
      fotoEntregaUrl: entrega.fotoEntregaUrl || '',
      fotoGuiaUrl: entrega.fotoGuiaUrl || '',
      notas: entrega.notas || ''
    };
    this.modalPODVisible.set(true);
  }

  cerrarModalPOD() {
    this.modalPODVisible.set(false);
    this.entregaSeleccionada.set(null);
  }

  async onArchivoPaquete(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const url = await this.storageService.subirArchivo(input.files[0], 'evidencias');
        this.podForm.fotoEntregaUrl = url;
      } catch {
        this.error.set('Error al procesar la foto del paquete');
      }
    }
  }

  async onArchivoGuia(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const url = await this.storageService.subirArchivo(input.files[0], 'evidencias');
        this.podForm.fotoGuiaUrl = url;
      } catch {
        this.error.set('Error al procesar la foto de la guía');
      }
    }
  }

  confirmarEntrega() {
    const entrega = this.entregaSeleccionada();
    if (!entrega) return;

    this.guardandoPOD.set(true);
    const req: ActualizarEntregaRequest = {
      idEstadoEntrega: EstadoEntregaId.ENTREGADO,
      fotoEntregaUrl: this.podForm.fotoEntregaUrl || undefined,
      fotoGuiaUrl: this.podForm.fotoGuiaUrl || undefined,
      notas: this.podForm.notas || undefined
    };

    this.entregasService.actualizarEstado(entrega.idEntrega, req).subscribe({
      next: () => {
        this.guardandoPOD.set(false);
        this.cerrarModalPOD();
        this.mensaje.set(`✓ Entrega #${entrega.idEntrega} registrada exitosamente con Prueba de Entrega (POD).`);
        if (this.rutaSeleccionada()) {
          this.cargarEntregas(this.rutaSeleccionada()!.idProgramacion);
        }
      },
      error: (err) => {
        this.guardandoPOD.set(false);
        this.error.set('No se pudo guardar la prueba de entrega.');
      }
    });
  }

  reportarIncidencia(entrega: Entrega) {
    this.router.navigate(['/app/incidencias'], {
      queryParams: {
        idEntrega: entrega.idEntrega,
        idPedido: entrega.idPedido
      }
    });
  }

  verFoto(url: string, titulo: string, entrega: Entrega) {
    this.fotoUrl.set(url);
    this.fotoTitulo.set(titulo);
    this.fotoEntregaContexto.set(entrega);
    this.modalFotoVisible.set(true);
  }

  cerrarModalFoto() {
    this.modalFotoVisible.set(false);
    this.fotoUrl.set('');
    this.fotoEntregaContexto.set(null);
  }

  onThumbError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=100&q=80';
  }

  private limpiarAvisos() {
    this.mensaje.set('');
    this.error.set('');
  }
}
