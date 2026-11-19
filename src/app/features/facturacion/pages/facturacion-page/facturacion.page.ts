import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, switchMap } from 'rxjs';
import { UsuarioActualService } from '../../../../core/services/usuario-actual.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { FacturacionService } from '../../facturacion.service';
import {
  Comprobante,
  ComprobanteForm,
  PedidoOpcion,
  TipoComprobante,
} from '../../comprobante.model';

@Component({
  selector: 'app-facturacion-page',
  standalone: true,
  imports: [FormsModule, DatePipe, PageHeaderComponent],
  template: `
    <app-page-header title="Facturación y Guías de Remisión" subtitle="Emisión y descarga de los documentos de cada pedido">
      <button class="btn-primary" (click)="nuevo()">+ Emitir comprobante</button>
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">{{ mensaje() }}</div>
    }
    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    @if (mostrarForm()) {
      <div class="content-card">
        <h3>Emitir comprobante</h3>
        <form #f="ngForm" (ngSubmit)="emitir()" class="form-grid">
          <label>Pedido
            <select name="idPedido" #pedido="ngModel" [(ngModel)]="form.idPedido" required>
              <option [ngValue]="null" disabled>Seleccione...</option>
              @for (p of pedidos(); track p.idPedido) {
                <option [ngValue]="p.idPedido">N° {{ p.idPedido }} - {{ p.cliente }} ({{ p.estado }})</option>
              }
            </select>
            @if (pedido.invalid && pedido.touched) {
              <small>Seleccione un pedido.</small>
            }
          </label>
          <label>Tipo de comprobante
            <select name="idTipoComprobante" #tipo="ngModel" [(ngModel)]="form.idTipoComprobante" required>
              <option [ngValue]="null" disabled>Seleccione...</option>
              @for (t of tipos(); track t.idTipoComprobante) {
                <option [ngValue]="t.idTipoComprobante">{{ t.nombre }}</option>
              }
            </select>
            @if (tipo.invalid && tipo.touched) {
              <small>Seleccione un tipo.</small>
            }
          </label>
          <label>Serie (opcional)
            <input name="serie" #serie="ngModel" [(ngModel)]="form.serie" pattern="[A-Za-z0-9]{4}" maxlength="4" placeholder="Automática" />
            @if (serie.invalid && serie.touched) {
              <small>Debe tener 4 letras o números (ej. F001).</small>
            }
          </label>
          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="f.invalid || guardando()">Emitir</button>
            <button type="button" class="btn-secondary" (click)="cancelar()">Cancelar</button>
          </div>
        </form>
      </div>
    }

    <div class="content-card">
      <div class="toolbar">
        <label>Filtrar por pedido
          <select name="filtroPedido" [ngModel]="filtroPedido" (ngModelChange)="filtrarPedido($event)">
            <option [ngValue]="null">Todos</option>
            @for (p of pedidos(); track p.idPedido) {
              <option [ngValue]="p.idPedido">N° {{ p.idPedido }} - {{ p.cliente }}</option>
            }
          </select>
        </label>
        <label>Filtrar por tipo
          <select name="filtroTipo" [ngModel]="filtroTipo" (ngModelChange)="filtrarTipo($event)">
            <option [ngValue]="null">Todos</option>
            @for (t of tipos(); track t.idTipoComprobante) {
              <option [ngValue]="t.idTipoComprobante">{{ t.nombre }}</option>
            }
          </select>
        </label>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Número</th><th>Tipo</th><th>Pedido</th><th>Cliente</th>
              <th>Emisión</th><th>Emitido por</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
                        @if (cargando()) {
              <tr>
                <td colspan="7">
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <span>Cargando información...</span>
                  </div>
                </td>
              </tr>
            } @else {
            @for (c of comprobantes(); track c.idComprobante) {
              <tr>
                <td class="nowrap"><strong>{{ c.numeroCompleto }}</strong></td>
                <td>{{ c.tipoComprobante }}</td>
                <td class="nowrap">N° {{ c.idPedido }}</td>
                <td>{{ clientes().get(c.idPedido) ?? '-' }}</td>
                <td class="nowrap">{{ c.fechaEmision | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ c.nombreUsuario }}</td>
                <td>
                  <div class="row-actions">
                    <button [disabled]="descargandoId() !== null" (click)="descargar(c)">
                      {{ descargandoId() === c.idComprobante ? 'Generando...' : 'Descargar PDF' }}
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
                <tr><td colspan="7">No hay comprobantes para los filtros seleccionados.</td></tr>
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
    .form-grid input, .form-grid select, .toolbar select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; min-width: 0; }
    .form-grid small { color: #b91c1c; }
    .actions { display: flex; gap: 0.5rem; align-self: end; }
    .toolbar { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 280px)); gap: 1rem; margin-bottom: 1rem; }
    .table-wrap { overflow-x: auto; contain: inline-size; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .data-table th { color: #475569; background: #f8fafc; font-weight: 600; white-space: nowrap; }
    .nowrap { white-space: nowrap; }
    .row-actions { display: flex; gap: 0.4rem; }
    .row-actions button { padding: 0.25rem 0.6rem; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; white-space: nowrap; }
    .row-actions button:disabled { opacity: 0.5; cursor: not-allowed; }
    .alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert.ok { background: #dcfce7; color: #166534; }
    .alert.err { background: #fee2e2; color: #991b1b; }
  `],
})
export class FacturacionPageComponent implements OnInit {
  private service = inject(FacturacionService);
  private usuarioActual = inject(UsuarioActualService);
  private consulta?: Subscription;

  comprobantes = signal<Comprobante[]>([]);
  pedidos = signal<PedidoOpcion[]>([]);
  tipos = signal<TipoComprobante[]>([]);
  clientes = computed(() => new Map(this.pedidos().map(p => [p.idPedido, p.cliente])));

  cargando = signal(false);
  guardando = signal(false);
  descargandoId = signal<number | null>(null);
  error = signal('');
  mensaje = signal('');
  mostrarForm = signal(false);

  filtroPedido: number | null = null;
  filtroTipo: number | null = null;
  form: ComprobanteForm = this.formVacio();

  ngOnInit(): void {
    this.service.pedidos().subscribe({
      next: data => this.pedidos.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los pedidos'),
    });
    this.service.tipos().subscribe({
      next: data => this.tipos.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los tipos de comprobante'),
    });
    this.cargar();
  }

  cargar(): void {
    // Si cambian los filtros, la respuesta anterior ya no debe mostrarse
    this.consulta?.unsubscribe();
    this.cargando.set(true);
    this.consulta = this.service.listar(this.filtroPedido, this.filtroTipo).subscribe({
      next: data => {
        this.comprobantes.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.comprobantes.set([]);
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudieron cargar los comprobantes');
      },
    });
  }

  filtrarPedido(idPedido: number | null): void {
    this.limpiarAvisos();
    this.filtroPedido = idPedido;
    this.cargar();
  }

  filtrarTipo(idTipo: number | null): void {
    this.limpiarAvisos();
    this.filtroTipo = idTipo;
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

  emitir(): void {
    this.limpiarAvisos();
    this.guardando.set(true);
    const { idPedido, idTipoComprobante, serie } = this.form;
    this.usuarioActual.obtenerId().pipe(
      switchMap(idUsuario => this.service.emitir({
        idPedido: idPedido!,
        idTipoComprobante: idTipoComprobante!,
        // Sin serie, el backend asigna la del tipo; una cadena vacía no pasaría su validación
        serie: serie.trim().toUpperCase() || null,
        idUsuario,
      })),
    ).subscribe({
      next: comprobante => {
        this.guardando.set(false);
        this.mensaje.set(`Comprobante ${comprobante.numeroCompleto} emitido correctamente`);
        this.cancelar();
        this.cargar();
      },
      error: err => {
        this.guardando.set(false);
        this.mostrarError(err, 'No se pudo emitir el comprobante');
      },
    });
  }

  descargar(c: Comprobante): void {
    this.limpiarAvisos();
    this.descargandoId.set(c.idComprobante);
    this.service.descargarPdf(c.idComprobante).subscribe({
      next: archivo => {
        this.guardarArchivo(archivo, `${c.numeroCompleto}.pdf`);
        this.descargandoId.set(null);
      },
      error: err => {
        this.descargandoId.set(null);
        this.mostrarErrorDescarga(err, c);
      },
    });
  }

  private guardarArchivo(archivo: Blob, nombre: string): void {
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  // Con responseType blob, el cuerpo del error también llega como Blob
  private async mostrarErrorDescarga(err: HttpErrorResponse, c: Comprobante): Promise<void> {
    const porDefecto = `No se pudo descargar ${c.numeroCompleto}`;
    let detalle: string | undefined;
    if (err.error instanceof Blob) {
      try {
        detalle = JSON.parse(await err.error.text())?.mensaje;
      } catch {
        detalle = undefined;
      }
    }
    this.error.set(detalle ? `${porDefecto}: ${detalle}` : `${porDefecto} (HTTP ${err.status})`);
  }

  private formVacio(): ComprobanteForm {
    return { idPedido: null, idTipoComprobante: null, serie: '' };
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
