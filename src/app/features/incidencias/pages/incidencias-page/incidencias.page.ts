import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, switchMap } from 'rxjs';
import { UsuarioActualService } from '../../../../core/services/usuario-actual.service';
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
    <app-page-header title="Incidencias de Entrega" subtitle="Registro de los motivos de una entrega no completada">
      <button class="btn-primary" (click)="nuevo()">+ Registrar incidencia</button>
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">{{ mensaje() }}</div>
    }
    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    @if (mostrarForm()) {
      <div class="content-card">
        <h3>Registrar incidencia</h3>
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
              <small>Seleccione un tipo.</small>
            }
          </label>
          <label class="full">Comentario (opcional)
            <textarea name="comentario" rows="3" [(ngModel)]="form.comentario" maxlength="500"></textarea>
          </label>
          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="f.invalid || guardando()">Guardar</button>
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
              <th>ID</th><th>Fecha</th><th>Entrega</th><th>Pedido</th><th>Programación</th>
              <th>Tipo</th><th>Comentario</th><th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
                        @if (cargando()) {
              <tr>
                <td colspan="8">
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <span>Cargando información...</span>
                  </div>
                </td>
              </tr>
            } @else {
            @for (i of incidencias(); track i.idIncidencia) {
              <tr>
                <td>{{ i.idIncidencia }}</td>
                <td class="nowrap">{{ i.fechaHora | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td class="nowrap">N° {{ i.idEntrega }}</td>
                <td class="nowrap">N° {{ i.idPedido }}</td>
                <td class="nowrap">N° {{ i.idProgramacion }}</td>
                <td><strong>{{ i.tipoIncidencia }}</strong></td>
                <td class="comentario">{{ i.comentario ?? '-' }}</td>
                <td>{{ i.nombreUsuario }}</td>
              </tr>
            } @empty {
                <tr><td colspan="8">No hay incidencias para los filtros seleccionados.</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .content-card { background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
    .content-card h3 { margin-bottom: 1rem; }
    .btn-primary { padding: 0.5rem 1rem; background: var(--primary-color, #18d600); color: #052e16; border: none; border-radius: 9px; box-shadow: 0 4px 12px var(--primary-glow); font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-secondary { padding: 0.5rem 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 9px; color: #334155; font-weight: 600; cursor: pointer; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: start; }
    .form-grid label, .toolbar label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: #475569; }
    .form-grid input, .form-grid select, .form-grid textarea, .toolbar input, .toolbar select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; min-width: 0; }
    .form-grid .full { grid-column: 1 / -1; }
    .form-grid small { color: #b91c1c; }
    .actions { display: flex; gap: 0.5rem; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; margin-bottom: 1rem; }
    .table-wrap { overflow-x: auto; contain: inline-size; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .data-table th { color: #475569; background: #f8fafc; font-weight: 600; white-space: nowrap; }
    .nowrap { white-space: nowrap; }
    .comentario { min-width: 220px; }
    .alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert.ok { background: #dcfce7; color: #166534; }
    .alert.err { background: #fee2e2; color: #991b1b; }
  `],
})
export class IncidenciasPageComponent implements OnInit {
  private service = inject(IncidenciasService);
  private usuarioActual = inject(UsuarioActualService);
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

  ngOnInit(): void {
    this.service.pedidos().subscribe({
      next: data => this.pedidos.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los pedidos'),
    });
    this.service.tipos().subscribe({
      next: data => this.tipos.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los tipos de incidencia'),
    });
    this.cargar();
  }

  cargar(): void {
    // Si cambian los filtros, la respuesta anterior ya no debe mostrarse
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

  // El backend aplica un solo filtro a la vez, por eso cada uno limpia al otro
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

  registrar(): void {
    this.limpiarAvisos();
    this.guardando.set(true);
    const { idEntrega, idTipoIncidencia, comentario } = this.form;
    this.usuarioActual.obtenerId().pipe(
      switchMap(idUsuario => this.service.registrar({
        idEntrega: idEntrega!,
        idTipoIncidencia: idTipoIncidencia!,
        comentario,
        idUsuario,
      })),
    ).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set('Incidencia registrada correctamente');
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
    return { idEntrega: null, idTipoIncidencia: null, comentario: '' };
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
