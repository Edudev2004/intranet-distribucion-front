import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { MantenimientoService } from '../../mantenimiento.service';
import {
  Mantenimiento,
  MantenimientoRequest,
  TipoMantenimiento,
  VehiculoOpcion,
} from '../../mantenimiento.model';

@Component({
  selector: 'app-mantenimiento-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Mantenimiento de Flota" subtitle="Registro de mantenimientos programados por vehículo">
      <button class="btn-primary" (click)="nuevo()">+ Registrar mantenimiento</button>
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">{{ mensaje() }}</div>
    }
    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    @if (mostrarForm()) {
      <div class="content-card">
        <h3>{{ editandoId === null ? 'Registrar mantenimiento' : 'Editar mantenimiento #' + editandoId }}</h3>
        <form (ngSubmit)="guardar()" class="form-grid">
          <label>Vehículo
            <select name="idVehiculo" [(ngModel)]="form.idVehiculo" required>
              <option [ngValue]="null" disabled>Seleccione...</option>
              @for (v of vehiculos(); track v.idVehiculo) {
                <option [ngValue]="v.idVehiculo">{{ v.placa }} - {{ v.estado }}</option>
              }
            </select>
          </label>
          <label>Tipo de mantenimiento
            <select name="idTipoMantenimiento" [(ngModel)]="form.idTipoMantenimiento" required>
              <option [ngValue]="null" disabled>Seleccione...</option>
              @for (t of tipos(); track t.idTipoMantenimiento) {
                <option [ngValue]="t.idTipoMantenimiento">{{ t.nombre }}</option>
              }
            </select>
          </label>
          <label>Fecha de inicio
            <input name="fechaInicio" type="date" [(ngModel)]="form.fechaInicio" required />
          </label>
          <label>Fecha de fin
            <input name="fechaFin" type="date" [(ngModel)]="form.fechaFin" required />
          </label>
          <label>Costo (S/)
            <input name="costo" type="number" min="0" step="any" [(ngModel)]="form.costo" />
          </label>
          <label>Descripción
            <input name="descripcion" [(ngModel)]="form.descripcion" maxlength="255" />
          </label>
          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="cargando()">Guardar</button>
            <button type="button" class="btn-secondary" (click)="cancelar()">Cancelar</button>
          </div>
        </form>
      </div>
    }

    <div class="content-card">
      <h3>Estado de la flota</h3>
      <table class="data-table">
        <thead>
          <tr><th>Placa</th><th>Marca / Modelo</th><th>Capacidad (kg)</th><th>Estado</th></tr>
        </thead>
        <tbody>
          @for (v of vehiculos(); track v.idVehiculo) {
            <tr>
              <td><strong>{{ v.placa }}</strong></td>
              <td>{{ v.marca ?? '-' }} {{ v.modelo ?? '' }}</td>
              <td>{{ v.capacidadKg }}</td>
              <td><span class="badge" [class.warn]="v.estado === 'En mantenimiento'">{{ v.estado }}</span></td>
            </tr>
          } @empty {
            <tr><td colspan="4">No hay vehículos registrados.</td></tr>
          }
        </tbody>
      </table>
    </div>

    <div class="content-card">
      <div class="toolbar">
        <label>Filtrar por vehículo
          <select [ngModel]="filtroVehiculo" (ngModelChange)="filtrar($event)" name="filtroVehiculo">
            <option [ngValue]="null">Todos</option>
            @for (v of vehiculos(); track v.idVehiculo) {
              <option [ngValue]="v.idVehiculo">{{ v.placa }}</option>
            }
          </select>
        </label>
      </div>

      @if (cargando()) {
        <p>Cargando...</p>
      }

      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>Vehículo</th><th>Tipo</th><th>Inicio</th><th>Fin</th>
            <th>Costo</th><th>Descripción</th><th>Vigencia</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (m of mantenimientos(); track m.idMantenimiento) {
            <tr>
              <td>{{ m.idMantenimiento }}</td>
              <td><strong>{{ m.placa }}</strong></td>
              <td>{{ m.tipoMantenimiento }}</td>
              <td>{{ m.fechaInicio }}</td>
              <td>{{ m.fechaFin }}</td>
              <td>{{ m.costo ?? '-' }}</td>
              <td>{{ m.descripcion ?? '-' }}</td>
              <td><span class="badge" [class.warn]="m.vigente">{{ m.vigente ? 'Vigente' : 'No vigente' }}</span></td>
              <td class="row-actions">
                <button (click)="editar(m)">Editar</button>
                <button class="danger" (click)="eliminar(m)">Eliminar</button>
              </td>
            </tr>
          } @empty {
            @if (!cargando()) {
              <tr><td colspan="9">No hay mantenimientos registrados.</td></tr>
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
    .form-grid label, .toolbar label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: #475569; }
    .form-grid input, .form-grid select, .toolbar select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; }
    .actions { display: flex; gap: 0.5rem; }
    .toolbar { margin-bottom: 1rem; max-width: 280px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .data-table th { color: #475569; background: #f8fafc; font-weight: 600; }
    .row-actions { display: flex; gap: 0.4rem; }
    .row-actions button { padding: 0.25rem 0.6rem; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; }
    .row-actions .danger { color: #b91c1c; border-color: #fecaca; }
    .badge { padding: 0.15rem 0.6rem; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 0.8rem; }
    .badge.warn { background: #fef3c7; color: #92400e; }
    .alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert.ok { background: #dcfce7; color: #166534; }
    .alert.err { background: #fee2e2; color: #991b1b; }
  `],
})
export class MantenimientoPageComponent implements OnInit {
  private service = inject(MantenimientoService);

  mantenimientos = signal<Mantenimiento[]>([]);
  vehiculos = signal<VehiculoOpcion[]>([]);
  tipos = signal<TipoMantenimiento[]>([]);

  cargando = signal(false);
  error = signal('');
  mensaje = signal('');
  mostrarForm = signal(false);

  editandoId: number | null = null;
  filtroVehiculo: number | null = null;
  form: MantenimientoRequest = this.formVacio();

  ngOnInit(): void {
    this.cargarVehiculos();
    this.service.tipos().subscribe({
      next: data => this.tipos.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los tipos de mantenimiento'),
    });
    this.cargar();
  }

  cargarVehiculos(): void {
    this.service.vehiculos().subscribe({
      next: data => this.vehiculos.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los vehículos'),
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listar(this.filtroVehiculo).subscribe({
      next: data => {
        this.mantenimientos.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudieron cargar los mantenimientos');
      },
    });
  }

  filtrar(idVehiculo: number | null): void {
    this.filtroVehiculo = idVehiculo;
    this.cargar();
  }

  nuevo(): void {
    this.limpiarAvisos();
    this.editandoId = null;
    this.form = this.formVacio();
    this.mostrarForm.set(true);
  }

  editar(m: Mantenimiento): void {
    this.limpiarAvisos();
    this.editandoId = m.idMantenimiento;
    this.form = {
      idVehiculo: m.idVehiculo,
      idTipoMantenimiento: m.idTipoMantenimiento,
      fechaInicio: m.fechaInicio,
      fechaFin: m.fechaFin,
      descripcion: m.descripcion ?? '',
      costo: m.costo,
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
    const creando = this.editandoId === null;
    const peticion = creando
      ? this.service.crear(this.form)
      : this.service.actualizar(this.editandoId!, this.form);

    peticion.subscribe({
      next: () => {
        this.mensaje.set(creando ? 'Mantenimiento registrado correctamente' : 'Mantenimiento actualizado correctamente');
        this.cancelar();
        this.cargar();
        this.cargarVehiculos();
      },
      error: err => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudo guardar el mantenimiento');
      },
    });
  }

  eliminar(m: Mantenimiento): void {
    if (!confirm(`¿Eliminar el mantenimiento #${m.idMantenimiento} del vehículo ${m.placa}?`)) {
      return;
    }
    this.limpiarAvisos();
    this.service.eliminar(m.idMantenimiento).subscribe({
      next: () => {
        this.mensaje.set('Mantenimiento eliminado correctamente');
        this.cargar();
        this.cargarVehiculos();
      },
      error: err => this.mostrarError(err, 'No se pudo eliminar el mantenimiento'),
    });
  }

  private formVacio(): MantenimientoRequest {
    return { idVehiculo: null, idTipoMantenimiento: null, fechaInicio: '', fechaFin: '', descripcion: '', costo: null };
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