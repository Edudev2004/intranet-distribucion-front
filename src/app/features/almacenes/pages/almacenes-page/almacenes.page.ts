import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { AlmacenesService } from '../../almacenes.service';
import {
  Almacen,
  AlmacenRequest,
  ProductoAlmacen,
  SedeOpcion,
  TipoAlmacen,
} from '../../almacen.model';

@Component({
  selector: 'app-almacenes-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Gestión de Almacenes" subtitle="Registro, capacidad y ubicación de los almacenes por sede">
      <button class="btn-primary" (click)="nuevo()">+ Nuevo almacén</button>
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">{{ mensaje() }}</div>
    }
    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    @if (mostrarForm()) {
      <div class="content-card">
        <h3>{{ editandoId === null ? 'Registrar almacén' : 'Editar almacén #' + editandoId }}</h3>
        <form (ngSubmit)="guardar()" class="form-grid">
          <label>Sede
            <select name="idSede" [(ngModel)]="form.idSede" required>
              <option [ngValue]="null" disabled>Seleccione...</option>
              @for (s of sedes(); track s.idSede) {
                <option [ngValue]="s.idSede">{{ s.nombre }}</option>
              }
            </select>
          </label>
          <label>Nombre
            <input name="nombre" [(ngModel)]="form.nombre" required minlength="2" maxlength="100" />
          </label>
          <label>Tipo de almacén
            <select name="idTipoAlmacen" [(ngModel)]="form.idTipoAlmacen" required>
              <option [ngValue]="null" disabled>Seleccione...</option>
              @for (t of tipos(); track t.idTipoAlmacen) {
                <option [ngValue]="t.idTipoAlmacen">{{ t.nombre }}</option>
              }
            </select>
          </label>
          <label>Capacidad máxima
            <input name="capacidadMaxima" type="number" min="0.01" step="any" [(ngModel)]="form.capacidadMaxima" required />
          </label>
          <label>Ubicación
            <input name="ubicacion" [(ngModel)]="form.ubicacion" maxlength="255" />
          </label>
          <label class="check">
            <input name="activo" type="checkbox" [(ngModel)]="form.activo" /> Activo
          </label>
          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="cargando()">Guardar</button>
            <button type="button" class="btn-secondary" (click)="cancelar()">Cancelar</button>
          </div>
        </form>
      </div>
    }

    <div class="content-card">
      <div class="toolbar">
        <label>Filtrar por sede
          <select [ngModel]="filtroSede" (ngModelChange)="filtrar($event)" name="filtroSede">
            <option [ngValue]="null">Todas</option>
            @for (s of sedes(); track s.idSede) {
              <option [ngValue]="s.idSede">{{ s.nombre }}</option>
            }
          </select>
        </label>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Sede</th><th>Tipo</th>
            <th>Capacidad</th><th>Ubicación</th><th>Estado</th><th>Acciones</th>
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
            @for (a of almacenes(); track a.idAlmacen) {
            <tr>
              <td>{{ a.idAlmacen }}</td>
              <td><strong>{{ a.nombre }}</strong></td>
              <td>{{ a.sede }}</td>
              <td>{{ a.tipoAlmacen }}</td>
              <td>{{ a.capacidadMaxima }}</td>
              <td>{{ a.ubicacion ?? '-' }}</td>
              <td><span class="badge" [class.off]="!a.activo">{{ a.activo ? 'Activo' : 'Inactivo' }}</span></td>
              <td class="row-actions">
                <button (click)="verProductos(a)">Productos</button>
                <button (click)="editar(a)">Editar</button>
                <button class="danger" (click)="eliminar(a)">Eliminar</button>
              </td>
            </tr>
          } @empty {
                <tr><td colspan="8">No hay almacenes registrados.</td></tr>
              }
            }
          </tbody>
      </table>
    </div>

    @if (almacenSeleccionado()) {
      <div class="content-card">
        <h3>Productos en {{ almacenSeleccionado()!.nombre }}</h3>
        <table class="data-table">
          <thead>
            <tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Stock actual</th></tr>
          </thead>
          <tbody>
            @for (p of productos(); track p.idProducto) {
              <tr>
                <td>{{ p.codigo }}</td><td>{{ p.producto }}</td>
                <td>{{ p.categoria }}</td><td>{{ p.stockActual }}</td>
              </tr>
            } @empty {
              <tr><td colspan="4">Este almacén no tiene productos en inventario.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .content-card { background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
    .btn-primary { padding: 0.5rem 1rem; background: var(--primary-color, #18d600); color: #052e16; border: none; border-radius: 9px; box-shadow: 0 4px 12px var(--primary-glow); font-weight: 600; cursor: pointer; }
    .btn-secondary { padding: 0.5rem 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 9px; color: #334155; font-weight: 600; cursor: pointer; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: end; }
    .form-grid label, .toolbar label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: #475569; }
    .form-grid input, .form-grid select, .toolbar select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; }
    .check { flex-direction: row !important; align-items: center; gap: 0.5rem !important; }
    .actions { display: flex; gap: 0.5rem; }
    .toolbar { margin-bottom: 1rem; max-width: 280px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .data-table th { color: #475569; background: #f8fafc; font-weight: 600; }
    .row-actions { display: flex; gap: 0.4rem; }
    .row-actions button { padding: 0.25rem 0.6rem; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; }
    .row-actions .danger { color: #b91c1c; border-color: #fecaca; }
    .badge { padding: 0.15rem 0.6rem; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 0.8rem; }
    .badge.off { background: #fee2e2; color: #991b1b; }
    .alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert.ok { background: #dcfce7; color: #166534; }
    .alert.err { background: #fee2e2; color: #991b1b; }
  `],
})
export class AlmacenesPageComponent implements OnInit {
  private service = inject(AlmacenesService);

  almacenes = signal<Almacen[]>([]);
  sedes = signal<SedeOpcion[]>([]);
  tipos = signal<TipoAlmacen[]>([]);
  productos = signal<ProductoAlmacen[]>([]);
  almacenSeleccionado = signal<Almacen | null>(null);

  cargando = signal(false);
  error = signal('');
  mensaje = signal('');
  mostrarForm = signal(false);

  editandoId: number | null = null;
  filtroSede: number | null = null;
  form: AlmacenRequest = this.formVacio();

  ngOnInit(): void {
    this.service.sedes().subscribe({
      next: data => this.sedes.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar las sedes'),
    });
    this.service.tipos().subscribe({
      next: data => this.tipos.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los tipos de almacén'),
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listar(this.filtroSede).subscribe({
      next: data => {
        this.almacenes.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudieron cargar los almacenes');
      },
    });
  }

  filtrar(idSede: number | null): void {
    this.filtroSede = idSede;
    this.cargar();
  }

  nuevo(): void {
    this.limpiarAvisos();
    this.editandoId = null;
    this.form = this.formVacio();
    this.mostrarForm.set(true);
  }

  editar(a: Almacen): void {
    this.limpiarAvisos();
    this.editandoId = a.idAlmacen;
    this.form = {
      idSede: a.idSede,
      nombre: a.nombre,
      idTipoAlmacen: a.idTipoAlmacen,
      capacidadMaxima: a.capacidadMaxima,
      ubicacion: a.ubicacion ?? '',
      activo: a.activo,
    };
    this.mostrarForm.set(true);
  }

  cancelar(): void {
    this.mostrarForm.set(false);
    this.editandoId = null;
  }

  guardar(): void {
    this.limpiarAvisos();
    this.cargando.set(true);
    const peticion = this.editandoId === null
      ? this.service.crear(this.form)
      : this.service.actualizar(this.editandoId, this.form);

    peticion.subscribe({
      next: () => {
        this.mensaje.set(this.editandoId === null ? 'Almacén registrado correctamente' : 'Almacén actualizado correctamente');
        this.cancelar();
        this.cargar();
      },
      error: err => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudo guardar el almacén');
      },
    });
  }

  eliminar(a: Almacen): void {
    if (!confirm(`¿Eliminar el almacén "${a.nombre}"?`)) {
      return;
    }
    this.limpiarAvisos();
    this.service.eliminar(a.idAlmacen).subscribe({
      next: () => {
        this.mensaje.set('Almacén eliminado correctamente');
        if (this.almacenSeleccionado()?.idAlmacen === a.idAlmacen) {
          this.almacenSeleccionado.set(null);
        }
        this.cargar();
      },
      error: err => this.mostrarError(err, 'No se pudo eliminar el almacén'),
    });
  }

  verProductos(a: Almacen): void {
    this.limpiarAvisos();
    this.almacenSeleccionado.set(a);
    this.service.productos(a.idAlmacen).subscribe({
      next: data => this.productos.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los productos del almacén'),
    });
  }

  private formVacio(): AlmacenRequest {
    return { idSede: null, nombre: '', idTipoAlmacen: null, capacidadMaxima: null, ubicacion: '', activo: true };
  }

  private limpiarAvisos(): void {
    this.mensaje.set('');
    this.error.set('');
  }

  private mostrarError(err: HttpErrorResponse, porDefecto: string): void {
    const detalle = err.error?.message ?? err.error?.error;
    this.error.set(detalle ? `${porDefecto}: ${detalle}` : `${porDefecto} (HTTP ${err.status})`);
  }
}