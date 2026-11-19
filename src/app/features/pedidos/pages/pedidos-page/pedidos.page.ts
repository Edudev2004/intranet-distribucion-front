import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PedidosService } from '../../pedidos.service';
import {
  AlmacenOpcion,
  ClienteOpcion,
  LineaPedido,
  PedidoDetalle,
  PedidoRequest,
  PedidoResumen,
  ProductoDisponible,
} from '../../pedido.model';

@Component({
  selector: 'app-pedidos-page',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe, PageHeaderComponent],
  template: `
    <app-page-header title="Generación de Pedidos" subtitle="Registro de pedidos de clientes con validación de stock">
      <button class="btn-primary" (click)="nuevo()">+ Nuevo pedido</button>
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">{{ mensaje() }}</div>
    }
    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    @if (mostrarForm()) {
      <div class="content-card">
        <h3>Registrar pedido</h3>
        <form (ngSubmit)="guardar()">
          <div class="form-grid">
            <label>Cliente
              <select name="idCliente" [(ngModel)]="form.idCliente" required>
                <option [ngValue]="null" disabled>Seleccione...</option>
                @for (c of clientes(); track c.idCliente) {
                  <option [ngValue]="c.idCliente">{{ c.nombre }} ({{ c.documento }})</option>
                }
              </select>
            </label>
            <label>Almacén de despacho
              <select name="idAlmacen" [ngModel]="form.idAlmacen" (ngModelChange)="alCambiarAlmacen($event)" required>
                <option [ngValue]="null" disabled>Seleccione...</option>
                @for (a of almacenes(); track a.idAlmacen) {
                  <option [ngValue]="a.idAlmacen">{{ a.nombre }}</option>
                }
              </select>
            </label>
            <label>Fecha de entrega solicitada
              <input name="fechaEntrega" type="date" [min]="hoy" [(ngModel)]="form.fechaEntregaSolicitada" />
            </label>
            <label>Observación
              <input name="observacion" [(ngModel)]="form.observacion" maxlength="255" />
            </label>
          </div>

          <h4 class="subtitulo">Productos del pedido</h4>
          <div class="form-grid">
            <label>Producto
              <select name="productoSel" [(ngModel)]="productoSel" [disabled]="!form.idAlmacen">
                <option [ngValue]="null" disabled>
                  {{ form.idAlmacen ? 'Seleccione...' : 'Primero elija un almacén' }}
                </option>
                @for (p of productos(); track p.idProducto) {
                  <option [ngValue]="p">{{ p.codigo }} - {{ p.producto }} (stock {{ p.stockActual }})</option>
                }
              </select>
            </label>
            <label>Cantidad
              <input name="cantidadLinea" type="number" min="0.01" step="any" [(ngModel)]="cantidadLinea" />
            </label>
            <div class="actions">
              <button type="button" class="btn-secondary" (click)="agregarLinea()">Agregar producto</button>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr><th>Código</th><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr>
            </thead>
            <tbody>
              @for (l of lineas(); track l.producto.idProducto) {
                <tr>
                  <td>{{ l.producto.codigo }}</td>
                  <td>{{ l.producto.producto }}</td>
                  <td>S/ {{ l.producto.precioUnitario | number:'1.2-2' }}</td>
                  <td>{{ l.cantidad }}</td>
                  <td>S/ {{ l.cantidad * l.producto.precioUnitario | number:'1.2-2' }}</td>
                  <td class="row-actions">
                    <button type="button" class="danger" (click)="quitarLinea(l.producto.idProducto)">Quitar</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6">Aún no agregó productos.</td></tr>
              }
            </tbody>
          </table>

          <div class="total-box">Total del pedido: <strong>S/ {{ total() | number:'1.2-2' }}</strong></div>

          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="cargando()">Registrar pedido</button>
            <button type="button" class="btn-secondary" (click)="cancelar()">Cancelar</button>
          </div>
        </form>
      </div>
    }

    <div class="content-card">
      <div class="toolbar">
        <label>Filtrar por estado
          <select [ngModel]="filtroEstado" (ngModelChange)="filtrar($event)" name="filtroEstado">
            <option [ngValue]="null">Todos</option>
            <option [ngValue]="1">Pendiente</option>
            <option [ngValue]="2">Aprobado</option>
            <option [ngValue]="3">Rechazado</option>
          </select>
        </label>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>N°</th><th>Fecha</th><th>Cliente</th><th>Almacén</th>
            <th>Total</th><th>Estado</th><th>Acciones</th>
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
            @for (p of pedidos(); track p.idPedido) {
              <tr>
                <td><strong>{{ p.idPedido }}</strong></td>
                <td>{{ p.fechaPedido }}</td>
                <td>{{ p.cliente }}</td>
                <td>{{ p.almacen }}</td>
                <td>S/ {{ p.total | number:'1.2-2' }}</td>
                <td><span class="badge" [class.warn]="p.idEstadoPedido === 1" [class.off]="p.idEstadoPedido === 3">{{ p.estado }}</span></td>
                <td class="row-actions">
                  <button (click)="verDetalle(p)">Ver detalle</button>
                  @if (p.idEstadoPedido === 1) {
                    <button class="danger" (click)="eliminar(p)">Eliminar</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7">No hay pedidos registrados.</td></tr>
            }
          }
        </tbody>
      </table>
    </div>

    @if (detalle()) {
      <div class="content-card">
        <h3>Pedido N° {{ detalle()!.idPedido }}</h3>
        <p class="resumen">
          <strong>Cliente:</strong> {{ detalle()!.cliente }} &nbsp;|&nbsp;
          <strong>Almacén:</strong> {{ detalle()!.almacen }} &nbsp;|&nbsp;
          <strong>Estado:</strong> {{ detalle()!.estado }}<br />
          <strong>Registrado:</strong> {{ detalle()!.fechaPedido | date:'dd/MM/yyyy HH:mm' }} &nbsp;|&nbsp;
          <strong>Entrega solicitada:</strong>
          {{ detalle()!.fechaEntregaSolicitada ? (detalle()!.fechaEntregaSolicitada | date:'dd/MM/yyyy') : '-' }}<br />
          <strong>Observación:</strong> {{ detalle()!.observacion ?? '-' }}
        </p>
        <table class="data-table">
          <thead>
            <tr><th>Código</th><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            @for (d of detalle()!.detalles; track d.idProducto) {
              <tr>
                <td>{{ d.codigo }}</td>
                <td>{{ d.producto }}</td>
                <td>{{ d.cantidad }}</td>
                <td>S/ {{ d.precioUnitario | number:'1.2-2' }}</td>
                <td>S/ {{ d.subtotal | number:'1.2-2' }}</td>
              </tr>
            }
          </tbody>
        </table>
        <div class="total-box">Total: <strong>S/ {{ detalle()!.total | number:'1.2-2' }}</strong></div>
      </div>
    }
  `,
  styles: [`
    .content-card { background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
    .btn-primary { padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-secondary { padding: 0.5rem 1rem; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: end; margin-bottom: 1rem; }
    .form-grid label, .toolbar label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: #475569; }
    .form-grid input, .form-grid select, .toolbar select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; }
    .subtitulo { margin: 1rem 0 0.5rem; color: #1e293b; }
    .actions { display: flex; gap: 0.5rem; }
    .toolbar { margin-bottom: 1rem; max-width: 280px; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .data-table th { color: #475569; background: #f8fafc; font-weight: 600; }
    .row-actions { display: flex; gap: 0.4rem; }
    .row-actions button { padding: 0.25rem 0.6rem; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; }
    .row-actions .danger { color: #b91c1c; border-color: #fecaca; }
    .total-box { text-align: right; font-size: 1.05rem; margin-bottom: 1rem; color: #1e293b; }
    .resumen { font-size: 0.9rem; color: #475569; line-height: 1.7; }
    .badge { padding: 0.15rem 0.6rem; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 0.8rem; }
    .badge.warn { background: #fef3c7; color: #92400e; }
    .badge.off { background: #fee2e2; color: #991b1b; }
    .alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert.ok { background: #dcfce7; color: #166534; }
    .alert.err { background: #fee2e2; color: #991b1b; }
  `],
})
export class PedidosPageComponent implements OnInit {
  private service = inject(PedidosService);

  pedidos = signal<PedidoResumen[]>([]);
  clientes = signal<ClienteOpcion[]>([]);
  almacenes = signal<AlmacenOpcion[]>([]);
  productos = signal<ProductoDisponible[]>([]);
  lineas = signal<LineaPedido[]>([]);
  detalle = signal<PedidoDetalle | null>(null);

  cargando = signal(false);
  error = signal('');
  mensaje = signal('');
  mostrarForm = signal(false);

  total = computed(() =>
    this.lineas().reduce((suma, l) => suma + l.cantidad * l.producto.precioUnitario, 0)
  );

  filtroEstado: number | null = null;
  form: PedidoRequest = this.formVacio();
  productoSel: ProductoDisponible | null = null;
  cantidadLinea: number | null = null;
  hoy = this.fechaDeHoy();

  ngOnInit(): void {
    this.service.clientes().subscribe({
      next: data => this.clientes.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los clientes'),
    });
    this.service.almacenes().subscribe({
      next: data => this.almacenes.set(data.filter(a => a.activo)),
      error: err => this.mostrarError(err, 'No se pudieron cargar los almacenes'),
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listar(this.filtroEstado).subscribe({
      next: data => {
        this.pedidos.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudieron cargar los pedidos');
      },
    });
  }

  filtrar(idEstado: number | null): void {
    this.filtroEstado = idEstado;
    this.cargar();
  }

  nuevo(): void {
    this.limpiarAvisos();
    this.form = this.formVacio();
    this.productos.set([]);
    this.lineas.set([]);
    this.productoSel = null;
    this.cantidadLinea = null;
    this.mostrarForm.set(true);
  }

  cancelar(): void {
    this.mostrarForm.set(false);
  }

  alCambiarAlmacen(idAlmacen: number | null): void {
    this.form.idAlmacen = idAlmacen;
    this.lineas.set([]);
    this.productoSel = null;
    this.productos.set([]);
    if (idAlmacen) {
      this.service.productos(idAlmacen).subscribe({
        next: data => this.productos.set(data),
        error: err => this.mostrarError(err, 'No se pudieron cargar los productos del almacén'),
      });
    }
  }

  agregarLinea(): void {
    this.error.set('');
    const producto = this.productoSel;
    const cantidad = Number(this.cantidadLinea);
    if (!producto || !cantidad || cantidad <= 0) {
      this.error.set('Elija un producto e indique una cantidad mayor que cero');
      return;
    }
    const actual = this.lineas().find(l => l.producto.idProducto === producto.idProducto);
    const acumulada = (actual?.cantidad ?? 0) + cantidad;
    if (acumulada > producto.stockActual) {
      this.error.set(`Stock insuficiente de ${producto.codigo}: disponible ${producto.stockActual}, solicitado ${acumulada}`);
      return;
    }
    if (actual) {
      this.lineas.set(this.lineas().map(l =>
        l.producto.idProducto === producto.idProducto ? { ...l, cantidad: acumulada } : l));
    } else {
      this.lineas.set([...this.lineas(), { producto, cantidad }]);
    }
    this.productoSel = null;
    this.cantidadLinea = null;
  }

  quitarLinea(idProducto: number): void {
    this.lineas.set(this.lineas().filter(l => l.producto.idProducto !== idProducto));
  }

  guardar(): void {
    this.limpiarAvisos();
    if (this.lineas().length === 0) {
      this.error.set('Agregue al menos un producto al pedido');
      return;
    }
    const body: PedidoRequest = {
      ...this.form,
      fechaEntregaSolicitada: this.form.fechaEntregaSolicitada || null,
      detalles: this.lineas().map(l => ({ idProducto: l.producto.idProducto, cantidad: l.cantidad })),
    };
    this.cargando.set(true);
    this.service.crear(body).subscribe({
      next: creado => {
        this.mensaje.set(`Pedido N° ${creado.idPedido} registrado en estado ${creado.estado}`);
        this.cancelar();
        this.cargar();
        this.detalle.set(creado);
      },
      error: err => {
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudo registrar el pedido');
      },
    });
  }

  verDetalle(p: PedidoResumen): void {
    this.limpiarAvisos();
    this.service.obtener(p.idPedido).subscribe({
      next: data => this.detalle.set(data),
      error: err => this.mostrarError(err, 'No se pudo cargar el detalle del pedido'),
    });
  }

  eliminar(p: PedidoResumen): void {
    if (!confirm(`¿Eliminar el pedido N° ${p.idPedido} de ${p.cliente}?`)) {
      return;
    }
    this.limpiarAvisos();
    this.service.eliminar(p.idPedido).subscribe({
      next: () => {
        this.mensaje.set('Pedido eliminado correctamente');
        if (this.detalle()?.idPedido === p.idPedido) {
          this.detalle.set(null);
        }
        this.cargar();
      },
      error: err => this.mostrarError(err, 'No se pudo eliminar el pedido'),
    });
  }

  private formVacio(): PedidoRequest {
    return { idCliente: null, idAlmacen: null, fechaEntregaSolicitada: '', observacion: '', detalles: [] };
  }

  private fechaDeHoy(): string {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
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