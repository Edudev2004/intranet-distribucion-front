import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PedidosService } from '../../pedidos.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  AlmacenOpcion,
  AprobacionPedidoRequest,
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
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe, PageHeaderComponent, IconComponent],
  template: `
    <app-page-header
      title="Gestión y Aprobación de Pedidos"
      subtitle="Generación de pedidos de clientes, validación de stock y flujo de aprobación supervisada (RF-10, RF-11)"
    >
      <button type="button" class="btn-primary" (click)="nuevo()">
        <app-icon name="plus" [size]="16"></app-icon>
        <span>Nuevo Pedido</span>
      </button>
    </app-page-header>

    @if (mensaje()) {
      <div class="alert ok">
        <app-icon name="check-circle" [size]="18"></app-icon>
        <span>{{ mensaje() }}</span>
      </div>
    }
    @if (error()) {
      <div class="alert err">
        <app-icon name="alert" [size]="18"></app-icon>
        <span>{{ error() }}</span>
      </div>
    }

    <!-- KPIs de Pedidos -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon icon-total">
          <app-icon name="orders" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalPedidos() }}</span>
          <span class="stat-label">Total Pedidos</span>
        </div>
      </div>

      <div class="stat-card" [class.has-warning]="totalPendientes() > 0">
        <div class="stat-icon icon-pending">
          <app-icon name="alert" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalPendientes() }}</span>
          <span class="stat-label">Pendientes de Aprobación</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-approved">
          <app-icon name="check-circle" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalAprobados() }}</span>
          <span class="stat-label">Pedidos Aprobados</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-rejected">
          <app-icon name="x" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalRechazados() }}</span>
          <span class="stat-label">Pedidos Rechazados</span>
        </div>
      </div>
    </div>

    <!-- Formulario de Registro de Pedido -->
    @if (mostrarForm()) {
      <div class="content-card form-section">
        <div class="section-header">
          <h3>Registrar Nuevo Pedido</h3>
          <p>Seleccione el cliente, almacén de origen y agregue los productos con validación de stock disponible</p>
        </div>

        <form (ngSubmit)="guardar()">
          <div class="form-grid">
            <div class="form-group">
              <label>Cliente <span class="required">*</span></label>
              <select name="idCliente" [(ngModel)]="form.idCliente" required class="form-control">
                <option [ngValue]="null" disabled>Seleccione un cliente...</option>
                @for (c of clientes(); track c.idCliente) {
                  <option [ngValue]="c.idCliente">{{ c.nombre }} ({{ c.documento }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Almacén de despacho <span class="required">*</span></label>
              <select name="idAlmacen" [ngModel]="form.idAlmacen" (ngModelChange)="alCambiarAlmacen($event)" required class="form-control">
                <option [ngValue]="null" disabled>Seleccione almacén...</option>
                @for (a of almacenes(); track a.idAlmacen) {
                  <option [ngValue]="a.idAlmacen">{{ a.nombre }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Fecha de entrega solicitada</label>
              <input name="fechaEntrega" type="date" [min]="hoy" [(ngModel)]="form.fechaEntregaSolicitada" class="form-control" />
            </div>

            <div class="form-group">
              <label>Observación</label>
              <input name="observacion" [(ngModel)]="form.observacion" maxlength="255" placeholder="Instrucciones adicionales..." class="form-control" />
            </div>
          </div>

          <h4 class="subtitulo">Productos del Pedido</h4>
          <div class="product-add-row">
            <div class="form-group flex-2">
              <label>Producto disponible</label>
              <select name="productoSel" [(ngModel)]="productoSel" [disabled]="!form.idAlmacen" class="form-control">
                <option [ngValue]="null" disabled>
                  {{ form.idAlmacen ? 'Seleccione producto...' : 'Primero elija un almacén' }}
                </option>
                @for (p of productos(); track p.idProducto) {
                  <option [ngValue]="p">{{ p.codigo }} - {{ p.producto }} (Stock: {{ p.stockActual }})</option>
                }
              </select>
            </div>

            <div class="form-group flex-1">
              <label>Cantidad</label>
              <input name="cantidadLinea" type="number" min="0.01" step="any" placeholder="Ej. 10" [(ngModel)]="cantidadLinea" class="form-control" />
            </div>

            <div class="form-group add-btn-col">
              <button type="button" class="btn-secondary" (click)="agregarLinea()" [disabled]="!productoSel">
                <app-icon name="plus" [size]="15"></app-icon>
                <span>Agregar Producto</span>
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th class="text-right">Precio Unitario</th>
                  <th class="text-right">Cantidad</th>
                  <th class="text-right">Subtotal</th>
                  <th class="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (l of lineas(); track l.producto.idProducto) {
                  <tr>
                    <td><span class="code-badge">{{ l.producto.codigo }}</span></td>
                    <td><strong>{{ l.producto.producto }}</strong></td>
                    <td class="text-right">S/ {{ l.producto.precioUnitario | number:'1.2-2' }}</td>
                    <td class="text-right">{{ l.cantidad }}</td>
                    <td class="text-right font-bold">S/ {{ l.cantidad * l.producto.precioUnitario | number:'1.2-2' }}</td>
                    <td class="text-center">
                      <button type="button" class="btn-action delete" (click)="quitarLinea(l.producto.idProducto)" title="Quitar">
                        <app-icon name="trash" [size]="15"></app-icon>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="text-center empty-cell">Aún no se han agregado productos a la orden.</td></tr>
                }
              </tbody>
            </table>
          </div>

          <div class="total-bar">
            <span>Total calculado de la orden:</span>
            <strong class="total-amount">S/ {{ total() | number:'1.2-2' }}</strong>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="cancelar()">Cancelar</button>
            <button type="submit" class="btn-primary" [disabled]="cargando() || lineas().length === 0">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Registrar Pedido</span>
            </button>
          </div>
        </form>
      </div>
    }

    <!-- Listado Principal de Pedidos -->
    <div class="content-card">
      <div class="toolbar">
        <div class="search-box">
          <app-icon name="search" [size]="16"></app-icon>
          <input
            type="text"
            placeholder="Buscar por N°, cliente o almacén..."
            [(ngModel)]="busquedaTexto"
          />
        </div>

        <div class="filter-actions">
          <select [ngModel]="filtroEstado" (ngModelChange)="filtrar($event)" name="filtroEstado" class="form-select">
            <option [ngValue]="null">Todos los Estados</option>
            <option [ngValue]="1">Pendientes de Aprobación</option>
            <option [ngValue]="2">Aprobados</option>
            <option [ngValue]="3">Rechazados</option>
          </select>

          <button type="button" class="btn-icon" (click)="cargar()" title="Actualizar">
            <app-icon name="refresh" [size]="16"></app-icon>
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>N° Pedido</th>
              <th>Fecha de Emisión</th>
              <th>Cliente</th>
              <th>Almacén</th>
              <th class="text-right">Total</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @if (cargando()) {
              <tr>
                <td colspan="7">
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <span>Cargando pedidos...</span>
                  </div>
                </td>
              </tr>
            } @else {
              @for (p of pedidosFiltrados(); track p.idPedido) {
                <tr>
                  <td><span class="order-id">#PED-{{ p.idPedido }}</span></td>
                  <td><span class="date-text">{{ p.fechaPedido }}</span></td>
                  <td><strong>{{ p.cliente }}</strong></td>
                  <td><span>{{ p.almacen }}</span></td>
                  <td class="text-right"><strong class="amount">S/ {{ p.total | number:'1.2-2' }}</strong></td>
                  <td>
                    <span [class]="'badge-status status-' + getEstadoClase(p.idEstadoPedido)">
                      {{ p.estado }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="actions-wrapper">
                      <!-- Ver Detalle -->
                      <button
                        type="button"
                        class="btn-action view"
                        (click)="verDetalle(p)"
                        title="Ver detalle del pedido"
                      >
                        <app-icon name="eye" [size]="15"></app-icon>
                      </button>

                      <!-- RF-11: Aprobar Pedido (Solo para pedidos pendientes) -->
                      @if (p.idEstadoPedido === 1) {
                        <button
                          type="button"
                          class="btn-action approve"
                          (click)="abrirModalAprobacion(p)"
                          [disabled]="!puedeAprobar()"
                          title="Aprobar pedido (Supervisor)"
                        >
                          <app-icon name="check" [size]="15"></app-icon>
                        </button>

                        <!-- RF-11: Rechazar Pedido (Solo para pedidos pendientes) -->
                        <button
                          type="button"
                          class="btn-action reject"
                          (click)="abrirModalRechazo(p)"
                          [disabled]="!puedeAprobar()"
                          title="Rechazar pedido (Supervisor)"
                        >
                          <app-icon name="x" [size]="15"></app-icon>
                        </button>

                        <!-- Eliminar Pedido -->
                        <button
                          type="button"
                          class="btn-action delete"
                          (click)="eliminar(p)"
                          title="Eliminar pedido"
                        >
                          <app-icon name="trash" [size]="15"></app-icon>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="text-center empty-cell">No se encontraron pedidos registrados.</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detalle Expandido del Pedido -->
    @if (detalle()) {
      <div class="content-card detail-card">
        <div class="detail-header">
          <div>
            <h3>Detalle del Pedido #PED-{{ detalle()!.idPedido }}</h3>
            <span class="detail-sub">Registrado el {{ detalle()!.fechaPedido | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <button type="button" class="btn-icon" (click)="detalle.set(null)" title="Cerrar">
            <app-icon name="x" [size]="16"></app-icon>
          </button>
        </div>

        <!-- Banner de Decisión de Aprobación / Rechazo (RF-11) -->
        @if (detalle()!.aprobacion) {
          <div [class]="'approval-banner banner-' + (detalle()!.aprobacion!.decision === 'APROBADO' ? 'ok' : 'err')">
            <div class="banner-icon">
              <app-icon [name]="detalle()!.aprobacion!.decision === 'APROBADO' ? 'check-circle' : 'alert'" [size]="20"></app-icon>
            </div>
            <div class="banner-content">
              <strong>Decisión: {{ detalle()!.aprobacion!.decision }}</strong>
              <p>
                Por <strong>{{ detalle()!.aprobacion!.usuarioAprobador }}</strong> el {{ detalle()!.aprobacion!.fecha | date:'dd/MM/yyyy HH:mm' }}
                @if (detalle()!.aprobacion!.motivo) {
                  — <em>Motivo: "{{ detalle()!.aprobacion!.motivo }}"</em>
                }
              </p>
            </div>
          </div>
        }

        <div class="resumen-grid">
          <div class="resumen-item">
            <span class="label">Cliente:</span>
            <strong>{{ detalle()!.cliente }}</strong>
          </div>
          <div class="resumen-item">
            <span class="label">Almacén de origen:</span>
            <strong>{{ detalle()!.almacen }}</strong>
          </div>
          <div class="resumen-item">
            <span class="label">Estado actual:</span>
            <span [class]="'badge-status status-' + getEstadoClase(detalle()!.idEstadoPedido)">
              {{ detalle()!.estado }}
            </span>
          </div>
          <div class="resumen-item">
            <span class="label">Fecha solicitada de entrega:</span>
            <strong>{{ detalle()!.fechaEntregaSolicitada ? (detalle()!.fechaEntregaSolicitada | date:'dd/MM/yyyy') : 'Inmediata' }}</strong>
          </div>
          @if (detalle()!.observacion) {
            <div class="resumen-item full">
              <span class="label">Observaciones:</span>
              <p>{{ detalle()!.observacion }}</p>
            </div>
          }
        </div>

        <h4 class="subtitulo">Artículos Solicitados</h4>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción del Producto</th>
                <th class="text-right">Cantidad</th>
                <th class="text-right">Precio Unitario</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              @for (d of detalle()!.detalles; track d.idProducto) {
                <tr>
                  <td><span class="code-badge">{{ d.codigo }}</span></td>
                  <td><strong>{{ d.producto }}</strong></td>
                  <td class="text-right font-bold">{{ d.cantidad }}</td>
                  <td class="text-right">S/ {{ d.precioUnitario | number:'1.2-2' }}</td>
                  <td class="text-right font-bold">S/ {{ d.subtotal | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="total-bar">
          <span>Importe Total:</span>
          <strong class="total-amount">S/ {{ detalle()!.total | number:'1.2-2' }}</strong>
        </div>

        <!-- Acciones rápidas desde el detalle (RF-11) -->
        @if (detalle()!.idEstadoPedido === 1 && puedeAprobar()) {
          <div class="detail-actions">
            <button type="button" class="btn-reject" (click)="abrirModalRechazoDesdeDetalle()">
              <app-icon name="x" [size]="15"></app-icon>
              <span>Rechazar Pedido</span>
            </button>
            <button type="button" class="btn-approve" (click)="abrirModalAprobacionDesdeDetalle()">
              <app-icon name="check" [size]="15"></app-icon>
              <span>Aprobar Pedido</span>
            </button>
          </div>
        }
      </div>
    }

    <!-- MODAL 1: APROBAR PEDIDO (RF-11) -->
    @if (mostrarModalAprobar()) {
      <div class="modal-backdrop" (click)="cerrarModalAprobacion()">
        <div class="modal-window" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Aprobar Pedido #PED-{{ pedidoAccion()?.idPedido }}</h3>
              <p>El pedido avanzará automáticamente a la fase de planificación de rutas y despacho</p>
            </div>
            <button type="button" class="btn-icon" (click)="cerrarModalAprobacion()">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <form (ngSubmit)="confirmarAprobacion()">
            <div class="modal-body">
              <div class="info-box">
                <p><strong>Cliente:</strong> {{ pedidoAccion()?.cliente }}</p>
                <p><strong>Importe Total:</strong> S/ {{ pedidoAccion()?.total | number:'1.2-2' }}</p>
                <p><strong>Almacén:</strong> {{ pedidoAccion()?.almacen }}</p>
              </div>

              <div class="form-group">
                <label>Notas de Aprobación (Opcional)</label>
                <textarea
                  rows="3"
                  [(ngModel)]="motivoAprobacion"
                  name="motivoAprobacion"
                  placeholder="Observaciones de crédito o confirmación de despacho..."
                  class="form-control"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="cerrarModalAprobacion()">Cancelar</button>
              <button type="submit" class="btn-approve-confirm" [disabled]="procesandoAccion()">
                <app-icon name="check" [size]="16"></app-icon>
                <span>{{ procesandoAccion() ? 'Aprobando...' : 'Confirmar Aprobación' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- MODAL 2: RECHAZAR PEDIDO (RF-11) -->
    @if (mostrarModalRechazar()) {
      <div class="modal-backdrop" (click)="cerrarModalRechazo()">
        <div class="modal-window" (click)="$event.stopPropagation()">
          <div class="modal-header header-danger">
            <div>
              <h3>Rechazar Pedido #PED-{{ pedidoAccion()?.idPedido }}</h3>
              <p>Especifique el motivo por el cual no procede este pedido (Requerido por auditoría)</p>
            </div>
            <button type="button" class="btn-icon" (click)="cerrarModalRechazo()">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          </div>

          <form (ngSubmit)="confirmarRechazo()">
            <div class="modal-body">
              <div class="info-box">
                <p><strong>Cliente:</strong> {{ pedidoAccion()?.cliente }}</p>
                <p><strong>Importe Total:</strong> S/ {{ pedidoAccion()?.total | number:'1.2-2' }}</p>
              </div>

              <div class="form-group">
                <label>Motivo del Rechazo <span class="required">*</span></label>
                <textarea
                  rows="3"
                  [(ngModel)]="motivoRechazo"
                  name="motivoRechazo"
                  required
                  placeholder="Ej. Línea de crédito excedida, inconsistencia en dirección de entrega, stock insuficiente..."
                  class="form-control"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="cerrarModalRechazo()">Cancelar</button>
              <button
                type="submit"
                class="btn-reject-confirm"
                [disabled]="procesandoAccion() || !motivoRechazo.trim()"
              >
                <app-icon name="x" [size]="16"></app-icon>
                <span>{{ procesandoAccion() ? 'Rechazando...' : 'Confirmar Rechazo' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      padding-bottom: 2rem;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0.625rem 1.25rem;
      background-color: #18d600;
      color: #052e16;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(24, 214, 0, 0.25);
      transition: all 0.2s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #15b800;
      transform: translateY(-1px);
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0.5rem 1rem;
      background-color: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #e2e8f0;
      color: #0f172a;
    }

    .btn-cancel {
      padding: 0.625rem 1.125rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .btn-cancel:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0.875rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 1.25rem;
    }

    .alert.ok {
      background-color: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .alert.err {
      background-color: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    /* Grid de KPIs */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: #ffffff;
      padding: 1.125rem 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .stat-card.has-warning {
      border-color: #fde047;
      background: #fffbeb;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-total { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
    .icon-pending { background: rgba(234, 179, 8, 0.15); color: #b45309; }
    .icon-approved { background: rgba(24, 214, 0, 0.12); color: #15803d; }
    .icon-rejected { background: rgba(239, 68, 68, 0.12); color: #dc2626; }

    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
    .stat-label { font-size: 0.775rem; font-weight: 600; color: #64748b; margin-top: 2px; }

    /* Content Cards */
    .content-card {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      margin-bottom: 1.5rem;
    }

    .section-header h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .section-header p {
      font-size: 0.825rem;
      color: #64748b;
      margin: 3px 0 1.25rem;
    }

    /* Toolbar y filtros */
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 1.25rem;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.5rem 0.875rem;
      flex: 1;
      max-width: 380px;
    }

    .search-box input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.875rem;
      color: #0f172a;
      width: 100%;
    }

    .filter-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-select {
      padding: 0.5rem 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background-color: #ffffff;
      color: #1e293b;
      font-size: 0.825rem;
      outline: none;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #94a3b8;
    }

    /* Tablas */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th, .data-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
    }

    .data-table th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.725rem;
      letter-spacing: 0.04em;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }

    .order-id {
      display: inline-block;
      padding: 2px 7px;
      background-color: #f1f5f9;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.8rem;
      color: #334155;
      font-family: monospace;
    }

    .code-badge {
      display: inline-block;
      padding: 2px 6px;
      background-color: #f1f5f9;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.775rem;
      color: #475569;
    }

    .date-text { font-size: 0.825rem; color: #475569; }
    .amount { color: #0f172a; }

    /* Badges de estado */
    .badge-status {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status-warn { background-color: #fef3c7; color: #92400e; }
    .status-ok { background-color: #dcfce7; color: #166534; }
    .status-danger { background-color: #fee2e2; color: #991b1b; }

    /* Botones de acción */
    .actions-wrapper {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .btn-action {
      width: 30px;
      height: 30px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-action.view:hover { background: #f1f5f9; color: #0f172a; }
    .btn-action.approve { color: #15803d; border-color: #bbf7d0; background: #f0fdf4; }
    .btn-action.approve:hover:not(:disabled) { background: #dcfce7; color: #166534; }
    .btn-action.reject { color: #b91c1c; border-color: #fecaca; background: #fef2f2; }
    .btn-action.reject:hover:not(:disabled) { background: #fee2e2; color: #991b1b; }
    .btn-action.delete:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
    .btn-action:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Formulario */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .form-group label {
      font-size: 0.825rem;
      font-weight: 600;
      color: #334155;
    }

    .required { color: #dc2626; }

    .form-control {
      padding: 0.55rem 0.825rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #0f172a;
      outline: none;
      background: #ffffff;
    }

    .form-control:focus {
      border-color: #18d600;
      box-shadow: 0 0 0 3px rgba(24, 214, 0, 0.15);
    }

    .product-add-row {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .flex-2 { flex: 2; min-width: 250px; }
    .flex-1 { flex: 1; min-width: 140px; }
    .add-btn-col { align-self: flex-end; }

    .subtitulo {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
      margin: 1.25rem 0 0.75rem;
    }

    .total-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      padding: 0.875rem 1rem;
      background: #f8fafc;
      border-radius: 8px;
      margin-top: 1rem;
      font-size: 0.95rem;
      color: #334155;
    }

    .total-amount {
      font-size: 1.25rem;
      color: #0f172a;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 1.25rem;
    }

    /* Detalle del Pedido */
    .detail-card {
      border-left: 4px solid #18d600;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .detail-header h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .detail-sub {
      font-size: 0.8rem;
      color: #64748b;
    }

    .approval-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0.875rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.25rem;
    }

    .approval-banner.banner-ok {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }

    .approval-banner.banner-err {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .banner-content strong {
      display: block;
      font-size: 0.9rem;
    }

    .banner-content p {
      font-size: 0.825rem;
      margin: 2px 0 0;
    }

    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 1.25rem;
    }

    .resumen-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.85rem;
    }

    .resumen-item.full {
      grid-column: 1 / -1;
    }

    .resumen-item .label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }

    .detail-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 1.25rem;
    }

    .btn-approve, .btn-approve-confirm {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0.625rem 1.25rem;
      background-color: #18d600;
      color: #052e16;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-approve:hover, .btn-approve-confirm:hover:not(:disabled) {
      background-color: #15b800;
    }

    .btn-reject, .btn-reject-confirm {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0.625rem 1.25rem;
      background-color: #dc2626;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-reject:hover, .btn-reject-confirm:hover:not(:disabled) {
      background-color: #b91c1c;
    }

    .btn-reject-confirm:disabled, .btn-approve-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Modales */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.5rem;
    }

    .modal-window {
      background: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      animation: modalIn 0.2s ease-out;
    }

    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-header.header-danger {
      background-color: #fff1f2;
      border-bottom-color: #fecdd3;
    }

    .modal-header h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .modal-header p {
      font-size: 0.8rem;
      color: #64748b;
      margin: 2px 0 0;
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-box {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 0.875rem 1rem;
      border: 1px solid #e2e8f0;
      font-size: 0.85rem;
    }

    .info-box p {
      margin: 3px 0;
      color: #334155;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }

    .loading-state {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      color: #64748b;
    }

    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #e2e8f0;
      border-top-color: #18d600;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-cell {
      padding: 2rem !important;
      color: #64748b;
    }
  `],
})
export class PedidosPageComponent implements OnInit {
  private service = inject(PedidosService);
  private authService = inject(AuthService);

  pedidos = signal<PedidoResumen[]>([]);
  clientes = signal<ClienteOpcion[]>([]);
  almacenes = signal<AlmacenOpcion[]>([]);
  productos = signal<ProductoDisponible[]>([]);
  lineas = signal<LineaPedido[]>([]);
  detalle = signal<PedidoDetalle | null>(null);

  cargando = signal(false);
  procesandoAccion = signal(false);
  error = signal('');
  mensaje = signal('');
  mostrarForm = signal(false);

  // Modales RF-11
  mostrarModalAprobar = signal(false);
  mostrarModalRechazar = signal(false);
  pedidoAccion = signal<PedidoResumen | null>(null);
  motivoAprobacion: string = '';
  motivoRechazo: string = '';

  busquedaTexto: string = '';
  filtroEstado: number | null = null;
  form: PedidoRequest = this.formVacio();
  productoSel: ProductoDisponible | null = null;
  cantidadLinea: number | null = null;
  hoy = this.fechaDeHoy();

  // Validación de permisos de supervisor/admin (RF-11)
  puedeAprobar = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return true; // Default fallback para entornos locales
    const rol = (user.role || '').toUpperCase();
    return rol === 'ADMIN' || rol === 'SUPERVISOR' || rol === 'WAREHOUSE' || rol === 'DISPATCHER';
  });

  // KPIs
  totalPedidos = computed(() => this.pedidos().length);
  totalPendientes = computed(() => this.pedidos().filter(p => p.idEstadoPedido === 1).length);
  totalAprobados = computed(() => this.pedidos().filter(p => p.idEstadoPedido === 2).length);
  totalRechazados = computed(() => this.pedidos().filter(p => p.idEstadoPedido === 3).length);

  total = computed(() =>
    this.lineas().reduce((suma, l) => suma + l.cantidad * l.producto.precioUnitario, 0)
  );

  pedidosFiltrados = computed(() => {
    let list = this.pedidos();
    const query = this.busquedaTexto.trim().toLowerCase();
    if (query) {
      list = list.filter(p =>
        p.idPedido.toString().includes(query) ||
        p.cliente.toLowerCase().includes(query) ||
        p.almacen.toLowerCase().includes(query)
      );
    }
    return list;
  });

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
      next: data => {
        this.detalle.set(data);
        // Si no vino aprobación en el objeto, intentar consultar
        if (!data.aprobacion && data.idEstadoPedido !== 1) {
          this.service.obtenerAprobacion(p.idPedido).subscribe({
            next: ap => {
              if (ap) {
                this.detalle.set({ ...data, aprobacion: ap });
              }
            },
            error: () => {}
          });
        }
      },
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

  // Métodos RF-11: Aprobación y Rechazo
  abrirModalAprobacion(p: PedidoResumen): void {
    this.pedidoAccion.set(p);
    this.motivoAprobacion = '';
    this.mostrarModalAprobar.set(true);
  }

  abrirModalAprobacionDesdeDetalle(): void {
    if (!this.detalle()) return;
    const p = this.pedidos().find(item => item.idPedido === this.detalle()!.idPedido);
    if (p) {
      this.abrirModalAprobacion(p);
    }
  }

  cerrarModalAprobacion(): void {
    this.mostrarModalAprobar.set(false);
    this.pedidoAccion.set(null);
  }

  confirmarAprobacion(): void {
    const pedido = this.pedidoAccion();
    if (!pedido) return;

    this.procesandoAccion.set(true);
    this.limpiarAvisos();

    const req: AprobacionPedidoRequest = {
      decision: 'APROBADO',
      motivo: this.motivoAprobacion.trim() || undefined
    };

    this.service.aprobarRechazar(pedido.idPedido, req).subscribe({
      next: res => {
        this.procesandoAccion.set(false);
        this.cerrarModalAprobacion();
        this.mensaje.set(`Pedido #PED-${pedido.idPedido} aprobado exitosamente por ${res.usuarioAprobador}.`);
        this.cargar();
        if (this.detalle()?.idPedido === pedido.idPedido) {
          this.verDetalle(pedido);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.procesandoAccion.set(false);
        this.mostrarError(err, 'Error al aprobar el pedido');
      }
    });
  }

  abrirModalRechazo(p: PedidoResumen): void {
    this.pedidoAccion.set(p);
    this.motivoRechazo = '';
    this.mostrarModalRechazar.set(true);
  }

  abrirModalRechazoDesdeDetalle(): void {
    if (!this.detalle()) return;
    const p = this.pedidos().find(item => item.idPedido === this.detalle()!.idPedido);
    if (p) {
      this.abrirModalRechazo(p);
    }
  }

  cerrarModalRechazo(): void {
    this.mostrarModalRechazar.set(false);
    this.pedidoAccion.set(null);
  }

  confirmarRechazo(): void {
    const pedido = this.pedidoAccion();
    if (!pedido || !this.motivoRechazo.trim()) {
      return;
    }

    this.procesandoAccion.set(true);
    this.limpiarAvisos();

    const req: AprobacionPedidoRequest = {
      decision: 'RECHAZADO',
      motivo: this.motivoRechazo.trim()
    };

    this.service.aprobarRechazar(pedido.idPedido, req).subscribe({
      next: res => {
        this.procesandoAccion.set(false);
        this.cerrarModalRechazo();
        this.mensaje.set(`Pedido #PED-${pedido.idPedido} rechazado. Motivo: ${res.motivo}`);
        this.cargar();
        if (this.detalle()?.idPedido === pedido.idPedido) {
          this.verDetalle(pedido);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.procesandoAccion.set(false);
        this.mostrarError(err, 'Error al rechazar el pedido');
      }
    });
  }

  getEstadoClase(idEstado: number): string {
    switch (idEstado) {
      case 1:
        return 'warn';
      case 2:
        return 'ok';
      case 3:
        return 'danger';
      default:
        return 'warn';
    }
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
