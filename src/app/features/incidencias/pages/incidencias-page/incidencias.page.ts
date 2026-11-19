import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { UsuarioActualService } from '../../../../core/services/usuario-actual.service';
import { SupabaseStorageService, EvidenciaPreset } from '../../../../core/services/supabase-storage.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { IncidenciasService } from '../../incidencias.service';
import {
  Incidencia,
  IncidenciaForm,
  PedidoOpcion,
  TipoIncidencia,
} from '../../incidencia.model';

@Component({
  selector: 'app-incidencias-page',
  standalone: true,
  imports: [FormsModule, DatePipe, PageHeaderComponent],
  template: `
    <app-page-header title="Incidencias de Entrega" subtitle="Registro de evidencias y motivos de entregas no completadas (RF-17)">
      <button class="btn-primary" (click)="nuevo()">+ Registrar incidencia</button>
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">{{ mensaje() }}</div>
    }
    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    @if (mostrarForm()) {
      <div class="content-card form-card">
        <div class="form-header">
          <h3>📸 Registrar Incidencia con Evidencia</h3>
          <span class="badge-bucket">Supabase Bucket: evidencias-entregas</span>
        </div>
        <form #f="ngForm" (ngSubmit)="registrar()" class="form-grid">
          <label>N° de entrega
            <input name="idEntrega" type="number" #entrega="ngModel" [(ngModel)]="form.idEntrega" required min="1" step="1" pattern="[0-9]+" />
            @if (entrega.invalid && entrega.touched) {
              <small>Ingrese un número de entrega válido.</small>
            }
          </label>
          <label>Tipo de incidencia
            <select name="idTipoIncidencia" #tipo="ngModel" [(ngModel)]="form.idTipoIncidencia" required>
              <option [ngValue]="null" disabled>Seleccione...</option>
              @for (t of tipos(); track t.idTipoIncidencia) {
                <option [ngValue]="t.idTipoIncidencia">{{ t.nombre }}</option>
              }
            </select>
            @if (tipo.invalid && tipo.touched) {
              <small>Seleccione un tipo de incidencia.</small>
            }
          </label>

          <!-- Adjuntar Foto de Evidencia -->
          <div class="full evidence-section">
            <label class="evidence-title">
              📷 Fotografía de Evidencia (Fachada cerrada, daño, rechazo)
            </label>
            <div class="evidence-grid">
              <div class="upload-box">
                <input type="file" accept="image/*" (change)="onArchivoSeleccionado($event)" id="fileIncidencia" class="file-input" />
                <label for="fileIncidencia" class="file-label">
                  📁 Subir foto desde el dispositivo
                </label>
                <div class="or-separator">o ingresar URL directa / Supabase Storage</div>
                <input
                  name="evidenciaUrl"
                  type="url"
                  [(ngModel)]="form.evidenciaUrl"
                  placeholder="https://...supabase.co/storage/v1/object/public/evidencias-entregas/foto.jpg"
                  class="url-input"
                />
                <div class="presets-row">
                  <span class="preset-label">Presets de prueba:</span>
                  @for (p of presetsIncidencia; track p.id) {
                    <button type="button" class="btn-preset" (click)="seleccionarPreset(p.url)">
                      {{ p.nombre }}
                    </button>
                  }
                </div>
              </div>

              @if (form.evidenciaUrl) {
                <div class="preview-card">
                  <img [src]="form.evidenciaUrl" alt="Vista previa de evidencia" (error)="onImgError($event)" />
                  <button type="button" class="btn-remove-photo" (click)="form.evidenciaUrl = ''">Quitar foto</button>
                </div>
              }
            </div>
          </div>

          <label class="full">Comentario y Observaciones del Conductor
            <textarea name="comentario" rows="3" [(ngModel)]="form.comentario" maxlength="500" placeholder="Detalle los motivos exactos de la no entrega..."></textarea>
          </label>
          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="f.invalid || guardando()">
              {{ guardando() ? 'Guardando...' : 'Registrar Incidencia' }}
            </button>
            <button type="button" class="btn-secondary" (click)="cancelar()">Cancelar</button>
          </div>
        </form>
      </div>
    }

    <div class="content-card">
      <div class="toolbar">
        <label>Buscar por N° de entrega
          <input name="filtroEntrega" type="number" min="1" step="1" [(ngModel)]="filtroEntrega" (keydown.enter)="buscarEntrega()" />
        </label>
        <button class="btn-secondary" (click)="buscarEntrega()">Buscar</button>
        <label>Filtrar por pedido
          <select name="filtroPedido" [ngModel]="filtroPedido" (ngModelChange)="filtrarPedido($event)">
            <option [ngValue]="null">Todos</option>
            @for (p of pedidos(); track p.idPedido) {
              <option [ngValue]="p.idPedido">N° {{ p.idPedido }} - {{ p.cliente }}</option>
            }
          </select>
        </label>
        <button class="btn-secondary" (click)="limpiarFiltros()">Limpiar</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Entrega</th>
              <th>Pedido</th>
              <th>Programación</th>
              <th>Tipo</th>
              <th>Evidencia</th>
              <th>Comentario</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            @if (cargando()) {
              <tr>
                <td colspan="9">
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <span>Cargando información...</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (i of incidencias(); track i.idIncidencia) {
                <tr>
                  <td><strong>#{{ i.idIncidencia }}</strong></td>
                  <td class="nowrap">{{ i.fechaHora | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td class="nowrap">Entrega #{{ i.idEntrega }}</td>
                  <td class="nowrap">Pedido #{{ i.idPedido }}</td>
                  <td class="nowrap">Ruta #{{ i.idProgramacion }}</td>
                  <td>
                    <span class="badge-incident">{{ i.tipoIncidencia }}</span>
                  </td>
                  <td>
                    @if (i.evidenciaUrl) {
                      <div class="thumbnail-wrapper" (click)="abrirModalFoto(i)">
                        <img [src]="i.evidenciaUrl" alt="Foto evidencia" class="thumb-img" (error)="onThumbError($event)" />
                        <span class="thumb-hint">🔍 Ver</span>
                      </div>
                    } @else {
                      <span class="no-photo">Sin foto</span>
                    }
                  </td>
                  <td class="comentario">{{ i.comentario ?? '-' }}</td>
                  <td>{{ i.nombreUsuario }}</td>
                </tr>
              } @empty {
                <tr><td colspan="9">No hay incidencias para los filtros seleccionados.</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Lightbox Modal para Inspeccionar Evidencia Fotográfica -->
    @if (modalFotoVisible() && incidenciaSeleccionada()) {
      <div class="modal-backdrop" (click)="cerrarModalFoto()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Evidencia Fotográfica de Incidencia</h3>
              <p>Entrega #{{ incidenciaSeleccionada()?.idEntrega }} &bull; {{ incidenciaSeleccionada()?.tipoIncidencia }}</p>
            </div>
            <button class="btn-close" (click)="cerrarModalFoto()">✕</button>
          </div>
          <div class="modal-body">
            <img [src]="incidenciaSeleccionada()?.evidenciaUrl" alt="Evidencia completa" class="full-img" />
            @if (incidenciaSeleccionada()?.comentario) {
              <div class="modal-comment">
                <strong>Observación del chofer:</strong> {{ incidenciaSeleccionada()?.comentario }}
              </div>
            }
          </div>
          <div class="modal-footer">
            <a [href]="incidenciaSeleccionada()?.evidenciaUrl" target="_blank" class="btn-secondary">Abrir original ↗</a>
            <button class="btn-primary" (click)="cerrarModalFoto()">Cerrar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .content-card { background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .form-header h3 { margin: 0; color: #0f172a; }
    .badge-bucket { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: 600; }
    .btn-primary { padding: 0.5rem 1rem; background: var(--primary-color, #18d600); color: #052e16; border: none; border-radius: 9px; box-shadow: 0 4px 12px var(--primary-glow); font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-secondary { padding: 0.5rem 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 9px; color: #334155; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: start; }
    .form-grid label, .toolbar label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: #475569; }
    .form-grid input, .form-grid select, .form-grid textarea, .toolbar input, .toolbar select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; min-width: 0; }
    .form-grid .full { grid-column: 1 / -1; }
    .form-grid small { color: #b91c1c; }
    .actions { display: flex; gap: 0.5rem; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; margin-bottom: 1rem; }
    .table-wrap { overflow-x: auto; contain: inline-size; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; vertical-align: middle; }
    .data-table th { color: #475569; background: #f8fafc; font-weight: 600; white-space: nowrap; }
    .nowrap { white-space: nowrap; }
    .comentario { min-width: 220px; color: #475569; }
    .badge-incident { background: #fee2e2; color: #991b1b; padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; }
    .alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert.ok { background: #dcfce7; color: #166534; }
    .alert.err { background: #fee2e2; color: #991b1b; }

    /* Evidence photo styles */
    .evidence-section { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 1rem; }
    .evidence-title { font-weight: 600; color: #1e293b; margin-bottom: 0.5rem; }
    .evidence-grid { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start; }
    .upload-box { flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 0.5rem; }
    .file-input { display: none; }
    .file-label { display: inline-block; padding: 0.5rem 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; text-align: center; font-weight: 600; color: #334155; }
    .file-label:hover { background: #f1f5f9; }
    .or-separator { font-size: 0.75rem; color: #64748b; text-align: center; }
    .presets-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; margin-top: 0.25rem; }
    .preset-label { font-size: 0.75rem; color: #64748b; }
    .btn-preset { font-size: 0.75rem; padding: 0.2rem 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #1e293b; }
    .btn-preset:hover { background: #e2e8f0; }
    .preview-card { position: relative; width: 140px; height: 110px; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; }
    .preview-card img { width: 100%; height: 100%; object-fit: cover; }
    .btn-remove-photo { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.7rem; border: none; padding: 0.25rem; cursor: pointer; }

    /* Thumbnail table preview */
    .thumbnail-wrapper { display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; background: #f1f5f9; padding: 2px 6px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .thumbnail-wrapper:hover { background: #e2e8f0; }
    .thumb-img { width: 34px; height: 34px; object-fit: cover; border-radius: 4px; }
    .thumb-hint { font-size: 0.75rem; color: #0284c7; font-weight: 600; }
    .no-photo { color: #94a3b8; font-size: 0.8rem; }

    /* Lightbox modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1rem; backdrop-filter: blur(4px); }
    .modal-content { background: #ffffff; border-radius: 12px; max-width: 650px; width: 100%; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); }
    .modal-header { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; }
    .modal-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
    .modal-header p { margin: 0.2rem 0 0 0; font-size: 0.8rem; color: #64748b; }
    .btn-close { background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; }
    .modal-body { padding: 1.25rem; text-align: center; background: #f8fafc; }
    .full-img { max-width: 100%; max-height: 420px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; }
    .modal-comment { margin-top: 1rem; text-align: left; padding: 0.75rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.85rem; color: #334155; }
    .modal-footer { padding: 1rem 1.25rem; display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #e2e8f0; background: #fff; }
  `],
})
export class IncidenciasPageComponent implements OnInit {
  private service = inject(IncidenciasService);
  private usuarioActual = inject(UsuarioActualService);
  private storageService = inject(SupabaseStorageService);
  private route = inject(ActivatedRoute);
  private consulta?: Subscription;

  incidencias = signal<Incidencia[]>([]);
  pedidos = signal<PedidoOpcion[]>([]);
  tipos = signal<TipoIncidencia[]>([]);

  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
  mensaje = signal('');
  mostrarForm = signal(false);

  filtroEntrega: number | null = null;
  filtroPedido: number | null = null;
  form: IncidenciaForm = this.formVacio();

  modalFotoVisible = signal(false);
  incidenciaSeleccionada = signal<Incidencia | null>(null);

  readonly presetsIncidencia: EvidenciaPreset[] = this.storageService.obtenerPresetsPorTipo('incidencia');

  ngOnInit(): void {
    this.service.pedidos().subscribe({
      next: data => this.pedidos.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los pedidos'),
    });
    this.service.tipos().subscribe({
      next: data => this.tipos.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los tipos de incidencia'),
    });

    // Revisar si viene de la vista de seguimiento de entregas con parámetros
    this.route.queryParams.subscribe(params => {
      if (params['idEntrega']) {
        const idEntrega = Number(params['idEntrega']);
        this.nuevo();
        this.form.idEntrega = idEntrega;
      }
    });

    this.cargar();
  }

  cargar(): void {
    this.consulta?.unsubscribe();
    this.cargando.set(true);
    this.consulta = this.service.listar(this.filtroEntrega, this.filtroPedido).subscribe({
      next: data => {
        this.incidencias.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.incidencias.set([]);
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudieron cargar las incidencias');
      },
    });
  }

  buscarEntrega(): void {
    this.limpiarAvisos();
    this.filtroPedido = null;
    this.cargar();
  }

  filtrarPedido(idPedido: number | null): void {
    this.limpiarAvisos();
    this.filtroPedido = idPedido;
    this.filtroEntrega = null;
    this.cargar();
  }

  limpiarFiltros(): void {
    this.limpiarAvisos();
    this.filtroEntrega = null;
    this.filtroPedido = null;
    this.cargar();
  }

  nuevo(): void {
    this.limpiarAvisos();
    this.form = this.formVacio();
    this.mostrarForm.set(true);
  }

  cancelar(): void {
    this.mostrarForm.set(false);
  }

  seleccionarPreset(url: string): void {
    this.form.evidenciaUrl = url;
  }

  async onArchivoSeleccionado(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const dataUrl = await this.storageService.procesarArchivo(input.files[0]);
        this.form.evidenciaUrl = dataUrl;
      } catch (err) {
        this.error.set('Error al procesar el archivo seleccionado');
      }
    }
  }

  abrirModalFoto(i: Incidencia): void {
    this.incidenciaSeleccionada.set(i);
    this.modalFotoVisible.set(true);
  }

  cerrarModalFoto(): void {
    this.modalFotoVisible.set(false);
    this.incidenciaSeleccionada.set(null);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=400&q=80';
  }

  onThumbError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=100&q=80';
  }

  registrar(): void {
    this.limpiarAvisos();
    this.guardando.set(true);
    const { idEntrega, idTipoIncidencia, comentario, evidenciaUrl } = this.form;
    this.usuarioActual.obtenerId().pipe(
      switchMap(idUsuario => this.service.registrar({
        idEntrega: idEntrega!,
        idTipoIncidencia: idTipoIncidencia!,
        comentario: comentario || undefined,
        evidenciaUrl: evidenciaUrl || undefined,
        idUsuario,
      })),
    ).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set('Incidencia y evidencia registradas correctamente');
        this.cancelar();
        this.cargar();
      },
      error: err => {
        this.guardando.set(false);
        this.mostrarError(err, 'No se pudo registrar la incidencia');
      },
    });
  }

  private formVacio(): IncidenciaForm {
    return { idEntrega: null, idTipoIncidencia: null, comentario: '', evidenciaUrl: '' };
  }

  private limpiarAvisos(): void {
    this.mensaje.set('');
    this.error.set('');
  }

  private mostrarError(err: HttpErrorResponse, porDefecto: string): void {
    const detalle = err.error?.mensaje ?? err.error?.message ?? err.error?.error;
    this.error.set(detalle ? `${porDefecto}: ${detalle}` : `${porDefecto} (HTTP ${err.status})`);
  }
}
