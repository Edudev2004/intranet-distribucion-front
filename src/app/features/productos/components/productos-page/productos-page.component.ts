import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ProductosService } from '../../productos.service';
import { Producto, ProductoRequest, CategoriaOpcion, UnidadOpcion } from '../../producto.model';

@Component({
  selector: 'app-productos-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Gestión de Productos" subtitle="Catálogo, precios, pesos y stock mínimo">
      <button class="btn-primary" (click)="nuevo()">+ Nuevo producto</button>
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">{{ mensaje() }}</div>
    }
    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    @if (mostrarForm()) {
      <div class="content-card">
        <h3>{{ editandoId === null ? 'Registrar producto' : 'Editar producto #' + editandoId }}</h3>
        <form (ngSubmit)="guardar()" class="form-grid">
          <label>Código
            <input name="codigo" [(ngModel)]="form.codigo" required maxlength="50" />
          </label>
          <label>Nombre
            <input name="nombre" [(ngModel)]="form.nombre" required minlength="2" maxlength="150" />
          </label>
          <label>Categoría
            <select name="idCategoria" [(ngModel)]="form.idCategoria" required>
              <option [ngValue]="null" disabled>Seleccione...</option>
              @for (c of categorias(); track c.idCategoria) {
                <option [ngValue]="c.idCategoria">{{ c.nombre }}</option>
              }
            </select>
          </label>
          <label>Unidad de medida
            <select name="idUnidad" [(ngModel)]="form.idUnidad" required>
              <option [ngValue]="null" disabled>Seleccione...</option>
              @for (u of unidades(); track u.idUnidad) {
                <option [ngValue]="u.idUnidad">{{ u.nombre }} ({{ u.codigo }})</option>
              }
            </select>
          </label>
          <label>Stock mínimo
            <input name="stockMinimo" type="number" min="0" step="any" [(ngModel)]="form.stockMinimo" required />
          </label>
          <label>Peso (Kg)
            <input name="pesoKg" type="number" min="0" step="any" [(ngModel)]="form.pesoKg" required />
          </label>
          <label>Precio unitario ($)
            <input name="precioUnitario" type="number" min="0" step="any" [(ngModel)]="form.precioUnitario" required />
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
      @if (cargando()) {
        <p>Cargando productos...</p>
      }

      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>Código</th><th>Nombre</th><th>Categoría</th>
            <th>Unidad</th><th>Stock Mín.</th><th>Peso (Kg)</th><th>Precio</th><th>Estado</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (p of productos(); track p.idProducto) {
            <tr>
              <td>{{ p.idProducto }}</td>
              <td><code>{{ p.codigo }}</code></td>
              <td><strong>{{ p.nombre }}</strong></td>
              <td>{{ p.categoria ?? '-' }}</td>
              <td>{{ p.unidad ?? '-' }}</td>
              <td>{{ p.stockMinimo }}</td>
              <td>{{ p.pesoKg }}</td>
              <td>$ {{ p.precioUnitario.toFixed(2) }}</td>
              <td><span class="badge" [class.off]="!p.activo">{{ p.activo ? 'Activo' : 'Inactivo' }}</span></td>
              <td class="row-actions">
                <button (click)="editar(p)">Editar</button>
                <button class="danger" (click)="eliminar(p)">Eliminar</button>
              </td>
            </tr>
          } @empty {
            @if (!cargando()) {
              <tr><td colspan="10">No hay productos registrados en el catálogo.</td></tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .content-card { background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
    .btn-primary { padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-secondary { padding: 0.5rem 1rem; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: end; }
    .form-grid label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: #475569; }
    .form-grid input, .form-grid select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; }
    .check { flex-direction: row !important; align-items: center; gap: 0.5rem !important; }
    .actions { display: flex; gap: 0.5rem; }
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
  `]
})
export class ProductosPageComponent implements OnInit {
  private service = inject(ProductosService);

  productos = signal<Producto[]>([]);
  categorias = signal<CategoriaOpcion[]>([]);
  unidades = signal<UnidadOpcion[]>([]);

  cargando = signal(false);
  error = signal('');
  mensaje = signal('');
  mostrarForm = signal(false);

  editandoId: number | null = null;
  form: ProductoRequest = this.formVacio();

  ngOnInit(): void {
    this.service.categorias().subscribe({
      next: data => this.categorias.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar las categorías')
    });
    this.service.unidades().subscribe({
      next: data => this.unidades.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar las unidades de medida')
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: data => {
        this.productos.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudieron cargar los productos');
      }
    });
  }

  nuevo(): void {
    this.limpiarAvisos();
    this.editandoId = null;
    this.form = this.formVacio();
    this.mostrarForm.set(true);
  }

  editar(p: Producto): void {
    this.limpiarAvisos();
    this.editandoId = p.idProducto;
    this.form = {
      codigo: p.codigo,
      nombre: p.nombre,
      idCategoria: p.idCategoria,
      idUnidad: p.idUnidad,
      stockMinimo: p.stockMinimo,
      pesoKg: p.pesoKg,
      precioUnitario: p.precioUnitario,
      activo: p.activo
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
        this.cargando.set(false);
        this.mensaje.set(this.editandoId === null ? 'Producto registrado correctamente' : 'Producto actualizado correctamente');
        this.cancelar();
        this.cargar();
      },
      error: err => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudo guardar el producto');
      }
    });
  }

  eliminar(p: Producto): void {
    if (!confirm(`¿Eliminar el producto "${p.nombre}"?`)) return;
    this.limpiarAvisos();
    this.service.eliminar(p.idProducto).subscribe({
      next: () => {
        this.mensaje.set('Producto eliminado correctamente');
        this.cargar();
      },
      error: err => this.mostrarError(err, 'No se pudo eliminar el producto')
    });
  }

  private formVacio(): ProductoRequest {
    return { codigo: '', nombre: '', idCategoria: null, idUnidad: null, stockMinimo: null, pesoKg: null, precioUnitario: null, activo: true };
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