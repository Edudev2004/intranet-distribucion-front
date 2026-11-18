import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CategoriasService } from '../../categorias.service';
import { Categoria, CategoriaRequest } from '../../categoria.model';

@Component({
  selector: 'app-categorias-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Gestión de Categorías" subtitle="Clasificación de los productos del catálogo">
      <button class="btn-primary" (click)="nuevo()">+ Nueva categoría</button>
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">{{ mensaje() }}</div>
    }
    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    @if (mostrarForm()) {
      <div class="content-card">
        <h3>{{ editandoId === null ? 'Registrar categoría' : 'Editar categoría #' + editandoId }}</h3>
        <form #f="ngForm" (ngSubmit)="guardar()" class="form-grid">
          <label>Nombre
            <input name="nombre" #nombre="ngModel" [(ngModel)]="form.nombre" required pattern=".*\\S.*" minlength="2" maxlength="100" />
            @if (nombre.invalid && nombre.touched) {
              <small>Debe tener entre 2 y 100 caracteres.</small>
            }
          </label>
          <label>Descripción
            <input name="descripcion" [(ngModel)]="form.descripcion" maxlength="255" />
          </label>
          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="f.invalid || guardando()">Guardar</button>
            <button type="button" class="btn-secondary" (click)="cancelar()">Cancelar</button>
          </div>
        </form>
      </div>
    }

    <div class="content-card">
      @if (cargando()) {
        <p>Cargando...</p>
      }

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            @for (c of categorias(); track c.idCategoria) {
              <tr>
                <td>{{ c.idCategoria }}</td>
                <td><strong>{{ c.nombre }}</strong></td>
                <td>{{ c.descripcion ?? '-' }}</td>
                <td>
                  <div class="row-actions">
                    <button (click)="editar(c)">Editar</button>
                    <button class="danger" (click)="eliminar(c)">Eliminar</button>
                  </div>
                </td>
              </tr>
            } @empty {
              @if (!cargando()) {
                <tr><td colspan="4">No hay categorías registradas.</td></tr>
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
    .btn-primary { padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-secondary { padding: 0.5rem 1rem; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: start; }
    .form-grid label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: #475569; }
    .form-grid input { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; }
    .form-grid small { color: #b91c1c; }
    .actions { display: flex; gap: 0.5rem; align-self: end; }
    .table-wrap { overflow-x: auto; contain: inline-size; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .data-table th { color: #475569; background: #f8fafc; font-weight: 600; }
    .row-actions { display: flex; gap: 0.4rem; }
    .row-actions button { padding: 0.25rem 0.6rem; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; }
    .row-actions .danger { color: #b91c1c; border-color: #fecaca; }
    .alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert.ok { background: #dcfce7; color: #166534; }
    .alert.err { background: #fee2e2; color: #991b1b; }
  `],
})
export class CategoriasPageComponent implements OnInit {
  private service = inject(CategoriasService);

  categorias = signal<Categoria[]>([]);

  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
  mensaje = signal('');
  mostrarForm = signal(false);

  editandoId: number | null = null;
  form: CategoriaRequest = this.formVacio();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: data => {
        this.categorias.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudieron cargar las categorías');
      },
    });
  }

  nuevo(): void {
    this.limpiarAvisos();
    this.editandoId = null;
    this.form = this.formVacio();
    this.mostrarForm.set(true);
  }

  editar(c: Categoria): void {
    this.limpiarAvisos();
    this.editandoId = c.idCategoria;
    this.form = { nombre: c.nombre, descripcion: c.descripcion ?? '' };
    this.mostrarForm.set(true);
  }

  cancelar(): void {
    this.mostrarForm.set(false);
    this.editandoId = null;
  }

  guardar(): void {
    this.limpiarAvisos();
    this.guardando.set(true);
    const creando = this.editandoId === null;
    const peticion = this.editandoId === null
      ? this.service.crear(this.form)
      : this.service.actualizar(this.editandoId, this.form);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set(creando ? 'Categoría registrada correctamente' : 'Categoría actualizada correctamente');
        this.cancelar();
        this.cargar();
      },
      error: err => {
        this.guardando.set(false);
        this.mostrarError(err, 'No se pudo guardar la categoría');
      },
    });
  }

  eliminar(c: Categoria): void {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"?`)) {
      return;
    }
    this.limpiarAvisos();
    this.service.eliminar(c.idCategoria).subscribe({
      next: () => {
        this.mensaje.set('Categoría eliminada correctamente');
        if (this.editandoId === c.idCategoria) {
          this.cancelar();
        }
        this.cargar();
      },
      error: err => this.mostrarError(err, 'No se pudo eliminar la categoría'),
    });
  }

  private formVacio(): CategoriaRequest {
    return { nombre: '', descripcion: '' };
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
