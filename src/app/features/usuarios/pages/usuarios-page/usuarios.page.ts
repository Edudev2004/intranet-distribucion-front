import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { UsuariosService } from '../../usuarios.service';
import { RolOpcion, SedeOpcion, Usuario, UsuarioRequest } from '../../usuario.model';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [FormsModule, DatePipe, PageHeaderComponent],
  template: `
    <app-page-header title="Gestión de Usuarios" subtitle="Registro, roles, sedes y estado de acceso de los usuarios">
      <button class="btn-primary" (click)="nuevo()">+ Nuevo usuario</button>
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">{{ mensaje() }}</div>
    }
    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    @if (mostrarForm()) {
      <div class="content-card">
        <h3>{{ editandoId === null ? 'Registrar usuario' : 'Editar usuario #' + editandoId }}</h3>
        <form #f="ngForm" (ngSubmit)="guardar()" class="form-grid">
          <label>Nombres
            <input name="nombres" #nombres="ngModel" [(ngModel)]="form.nombres" required pattern=".*\\S.*" maxlength="100" />
            @if (nombres.invalid && nombres.touched) {
              <small>Ingrese los nombres.</small>
            }
          </label>
          <label>Apellidos
            <input name="apellidos" #apellidos="ngModel" [(ngModel)]="form.apellidos" required pattern=".*\\S.*" maxlength="100" />
            @if (apellidos.invalid && apellidos.touched) {
              <small>Ingrese los apellidos.</small>
            }
          </label>
          <label>Usuario
            <input name="username" #username="ngModel" [(ngModel)]="form.username" required pattern=".*\\S.*" minlength="4" maxlength="50" autocomplete="off" />
            @if (username.invalid && username.touched) {
              <small>Debe tener entre 4 y 50 caracteres.</small>
            }
          </label>
          <label>Correo
            <input name="correo" type="email" #correo="ngModel" [(ngModel)]="form.correo" required email maxlength="150" autocomplete="off" />
            @if (correo.invalid && correo.touched) {
              <small>Ingrese un correo válido.</small>
            }
          </label>
          <label>{{ editandoId === null ? 'Contraseña' : 'Nueva contraseña (opcional)' }}
            <input name="password" type="password" #password="ngModel" [(ngModel)]="form.password" [required]="editandoId === null" minlength="8" maxlength="72" autocomplete="new-password" />
            @if (password.invalid && password.touched) {
              <small>Debe tener entre 8 y 72 caracteres.</small>
            }
          </label>
          <label>Rol
            <select name="idRol" #rol="ngModel" [(ngModel)]="form.idRol" required>
              <option [ngValue]="null" disabled>Seleccione...</option>
              @for (r of roles(); track r.id) {
                <option [ngValue]="r.id">{{ r.nombre }}</option>
              }
            </select>
            @if (rol.invalid && rol.touched) {
              <small>Seleccione un rol.</small>
            }
          </label>
          <label>Sede
            <select name="idSede" #sede="ngModel" [(ngModel)]="form.idSede" required>
              <option [ngValue]="null" disabled>Seleccione...</option>
              @for (s of sedes(); track s.idSede) {
                @if (s.activo || s.idSede === form.idSede) {
                  <option [ngValue]="s.idSede">{{ s.nombre }}{{ s.activo ? '' : ' (inactiva)' }}</option>
                }
              }
            </select>
            @if (sede.invalid && sede.touched) {
              <small>Seleccione una sede.</small>
            }
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
            <tr>
              <th>ID</th><th>Nombre</th><th>Usuario</th><th>Correo</th><th>Rol</th>
              <th>Sede</th><th>Estado</th><th>Último acceso</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (u of usuarios(); track u.idUsuario) {
              <tr>
                <td>{{ u.idUsuario }}</td>
                <td><strong>{{ u.nombres }} {{ u.apellidos }}</strong></td>
                <td>{{ u.username }}</td>
                <td>{{ u.correo }}</td>
                <td>{{ u.rol ?? '-' }}</td>
                <td>{{ u.sede ?? '-' }}</td>
                <td class="estado">
                  <span class="badge" [class.off]="!u.activo">{{ u.activo ? 'Activo' : 'Inactivo' }}</span>
                  @if (u.bloqueado) {
                    <span class="badge warn">Bloqueado</span>
                  }
                </td>
                <td>{{ u.ultimoAcceso ? (u.ultimoAcceso | date: 'dd/MM/yyyy HH:mm') : '-' }}</td>
                <td>
                  <div class="row-actions">
                    <button (click)="editar(u)">Editar</button>
                    <button
                      [class.danger]="u.activo"
                      [disabled]="u.activo && esCuentaPropia(u)"
                      [title]="u.activo && esCuentaPropia(u) ? 'No puedes desactivar tu propia cuenta' : ''"
                      (click)="cambiarEstado(u)">
                      {{ u.activo ? 'Desactivar' : 'Activar' }}
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              @if (!cargando()) {
                <tr><td colspan="9">No hay usuarios registrados.</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .content-card { background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
    .content-card h3 { margin-bottom: 1rem; color: #1e293b; }
    .btn-primary { padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-secondary { padding: 0.5rem 1rem; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer; color: #475569; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: start; }
    .form-grid label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: #475569; font-weight: 500; }
    .form-grid input, .form-grid select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; }
    .form-grid small { color: #b91c1c; font-size: 0.75rem; }
    .actions { display: flex; gap: 0.5rem; align-self: end; }
    .table-wrap { overflow-x: auto; contain: inline-size; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .data-table th { color: #475569; background: #f8fafc; font-weight: 600; white-space: nowrap; }
    .estado { white-space: nowrap; }
    .row-actions { display: flex; gap: 0.4rem; }
    .row-actions button { padding: 0.25rem 0.6rem; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .row-actions button:disabled { opacity: 0.5; cursor: not-allowed; }
    .row-actions .danger { color: #b91c1c; border-color: #fecaca; }
    .badge { padding: 0.15rem 0.6rem; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 0.8rem; font-weight: 500; }
    .badge.off { background: #fee2e2; color: #991b1b; }
    .badge.warn { background: #fef3c7; color: #92400e; margin-left: 0.25rem; }
    .alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
    .alert.ok { background: #dcfce7; color: #166534; }
    .alert.err { background: #fee2e2; color: #991b1b; }
  `],
})
export class UsuariosPageComponent implements OnInit {
  private service = inject(UsuariosService);
  private authService = inject(AuthService);

  usuarios = signal<Usuario[]>([]);
  roles = signal<RolOpcion[]>([]);
  sedes = signal<SedeOpcion[]>([]);

  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
  mensaje = signal('');
  mostrarForm = signal(false);

  editandoId: number | null = null;
  form: UsuarioRequest = this.formVacio();

  ngOnInit(): void {
    this.service.roles().subscribe({
      next: data => this.roles.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los roles'),
    });
    this.service.sedes().subscribe({
      next: data => this.sedes.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar las sedes'),
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: data => {
        this.usuarios.set([...data].sort((a, b) => a.idUsuario - b.idUsuario));
        this.cargando.set(false);
      },
      error: err => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudieron cargar los usuarios');
      },
    });
  }

  nuevo(): void {
    this.limpiarAvisos();
    this.editandoId = null;
    this.form = this.formVacio();
    this.mostrarForm.set(true);
  }

  editar(u: Usuario): void {
    this.limpiarAvisos();
    this.editandoId = u.idUsuario;
    this.form = {
      nombres: u.nombres,
      apellidos: u.apellidos,
      username: u.username,
      correo: u.correo,
      password: '',
      idRol: u.idRol,
      idSede: u.idSede,
    };
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
    const body: UsuarioRequest = { ...this.form, password: this.form.password || null };
    const peticion = this.editandoId === null
      ? this.service.crear(body)
      : this.service.actualizar(this.editandoId, body);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set(creando ? 'Usuario registrado correctamente' : 'Usuario actualizado correctamente');
        this.cancelar();
        this.cargar();
      },
      error: err => {
        this.guardando.set(false);
        this.mostrarError(err, 'No se pudo guardar el usuario');
      },
    });
  }

  cambiarEstado(u: Usuario): void {
    const activar = !u.activo;
    if (!confirm(`¿${activar ? 'Activar' : 'Desactivar'} al usuario "${u.username}"?`)) {
      return;
    }
    this.limpiarAvisos();
    this.service.cambiarEstado(u.idUsuario, activar).subscribe({
      next: actualizado => {
        this.usuarios.update(lista =>
          lista.map(item => (item.idUsuario === actualizado.idUsuario ? actualizado : item)));
        this.mensaje.set(activar ? 'Usuario activado correctamente' : 'Usuario desactivado correctamente');
      },
      error: err => this.mostrarError(err, 'No se pudo cambiar el estado del usuario'),
    });
  }

  esCuentaPropia(u: Usuario): boolean {
    return this.authService.currentUser()?.email?.trim().toLowerCase() === u.correo.toLowerCase();
  }

  private formVacio(): UsuarioRequest {
    return { nombres: '', apellidos: '', username: '', correo: '', password: '', idRol: null, idSede: null };
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