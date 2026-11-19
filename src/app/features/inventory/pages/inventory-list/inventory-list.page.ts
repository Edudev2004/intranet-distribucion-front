import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { InventoryService } from '../../services/inventory.service';
import { AlmacenesService } from '../../../almacenes/almacenes.service';
import { CategoriasService } from '../../../categorias/categorias.service';
import { ProductosService } from '../../../productos/productos.service';
import {
  InventarioConsulta,
  InventarioItem,
  AlertaStock,
  TipoMovimiento,
  MovimientoRequest,
  AjusteStockRequest,
  MovimientoResponse
} from '../../models/inventory.model';
import { Almacen } from '../../../almacenes/almacen.model';
import { Categoria } from '../../../categorias/categoria.model';
import { Producto } from '../../../productos/producto.model';

type InventoryTab = 'stock' | 'alertas' | 'kardex';

@Component({
  selector: 'app-inventory-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    DatePipe,
    PageHeaderComponent,
    IconComponent
  ],
  template: `
    <app-page-header
      title="Control de Stock e Inventario"
      subtitle="Monitoreo de existencias en tiempo real, alertas de reposición y kardex de movimientos (RF-08)"
    >
      <div class="header-actions">
        <button type="button" class="btn-secondary" (click)="abrirModalAjuste()">
          <app-icon name="edit" [size]="16"></app-icon>
          <span>Ajustar Stock</span>
        </button>
        <button type="button" class="btn-primary" (click)="abrirModalMovimiento()">
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Registrar Movimiento</span>
        </button>
      </div>
    </app-page-header>

    <!-- Notificaciones / Alertas de operación -->
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

    <!-- Tarjetas de Métricas / KPIs de Stock -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon icon-total">
          <app-icon name="inventory" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalProductosKPI() }}</span>
          <span class="stat-label">Productos en Inventario</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-normal">
          <app-icon name="check-circle" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalNormalKPI() }}</span>
          <span class="stat-label">Stock Operativo Normal</span>
        </div>
      </div>

      <div class="stat-card" [class.has-warning]="totalBajoStockKPI() > 0">
        <div class="stat-icon icon-warning">
          <app-icon name="alert" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalBajoStockKPI() }}</span>
          <span class="stat-label">Alertas de Bajo Stock</span>
        </div>
      </div>

      <div class="stat-card" [class.has-danger]="totalSinStockKPI() > 0">
        <div class="stat-icon icon-danger">
          <app-icon name="x" [size]="22"></app-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalSinStockKPI() }}</span>
          <span class="stat-label">Productos Agotados (Sin Stock)</span>
        </div>
      </div>
    </div>

    <!-- Navegación por Pestañas / Tabs -->
    <div class="tabs-container">
      <button
        type="button"
        class="tab-btn"
        [class.active]="activeTab() === 'stock'"
        (click)="cambiarTab('stock')"
      >
        <app-icon name="inventory" [size]="17"></app-icon>
        <span>Existencias Actuales</span>
        <span class="tab-badge">{{ items().length }}</span>
      </button>

      <button
        type="button"
        class="tab-btn"
        [class.active]="activeTab() === 'alertas'"
        (click)="cambiarTab('alertas')"
      >
        <app-icon name="alert" [size]="17"></app-icon>
        <span>Alertas de Stock</span>
        @if (alertas().length > 0) {
          <span class="tab-badge warning">{{ alertas().length }}</span>
        }
      </button>

      <button
        type="button"
        class="tab-btn"
        [class.active]="activeTab() === 'kardex'"
        (click)="cambiarTab('kardex')"
      >
        <app-icon name="reports" [size]="17"></app-icon>
        <span>Historial de Movimientos (Kardex)</span>
        @if (movimientos().length > 0) {
          <span class="tab-badge">{{ movimientos().length }}</span>
        }
      </button>
    </div>

    <!-- TAB 1: EXISTENCIAS ACTUALES -->
    @if (activeTab() === 'stock') {
      <div class="content-card">
        <!-- Barra de filtros -->
        <div class="filters-bar">
          <div class="search-input-wrapper">
            <app-icon name="search" [size]="17"></app-icon>
            <input
              type="text"
              placeholder="Buscar por código, producto o almacén..."
              [(ngModel)]="filtroTexto"
              (ngModelChange)="aplicarFiltrosLocales()"
            />
          </div>

          <div class="select-group">
            <select
              [(ngModel)]="filtroAlmacenId"
              (ngModelChange)="recargarInventario()"
              class="form-select"
            >
              <option [ngValue]="null">Todos los Almacenes</option>
              @for (alm of almacenes(); track alm.idAlmacen) {
                <option [ngValue]="alm.idAlmacen">{{ alm.nombre }}</option>
              }
            </select>

            <select
              [(ngModel)]="filtroCategoriaId"
              (ngModelChange)="recargarInventario()"
              class="form-select"
            >
              <option [ngValue]="null">Todas las Categorías</option>
              @for (cat of categorias(); track cat.idCategoria) {
                <option [ngValue]="cat.idCategoria">{{ cat.nombre }}</option>
              }
            </select>

            <label class="checkbox-filter">
              <input
                type="checkbox"
                [(ngModel)]="filtroSoloBajoStock"
                (ngModelChange)="recargarInventario()"
              />
              <span>Solo Alertas / Bajo Stock</span>
            </label>

            <button
              type="button"
              class="btn-icon"
              (click)="limpiarFiltros()"
              title="Limpiar filtros"
            >
              <app-icon name="x" [size]="16"></app-icon>
            </button>

            <button
              type="button"
              class="btn-icon"
              (click)="recargarInventario()"
              title="Actualizar datos"
            >
              <app-icon name="refresh" [size]="16"></app-icon>
            </button>
          </div>
        </div>

        <!-- Tabla de Datos -->
        @if (cargando()) {
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Cargando información de inventario...</p>
          </div>
        } @else if (itemsFiltrados().length === 0) {
          <div class="empty-box">
            <app-icon name="inventory" [size]="42"></app-icon>
            <h4>No se encontraron existencias</h4>
            <p>No hay productos registrados con los criterios seleccionados.</p>
            <button type="button" class="btn-primary" (click)="abrirModalMovimiento()">
              <app-icon name="plus" [size]="16"></app-icon>
              <span>Registrar Entrada</span>
            </button>
          </div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto & Unidad</th>
                  <th>Categoría</th>
                  <th>Almacén & Sede</th>
                  <th class="text-right">Stock Actual</th>
                  <th class="text-right">Stock Mínimo</th>
                  <th class="text-right">Precio Unit.</th>
                  <th class="text-right">Valor Total</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (item of itemsFiltrados(); track item.idAlmacen + '-' + item.idProducto) {
                  <tr>
                    <td>
                      <span class="code-badge">{{ item.codigo }}</span>
                    </td>
                    <td>
                      <div class="product-info">
                        <strong>{{ item.producto }}</strong>
                        <span class="unit-text">Unidad: {{ item.unidad }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="category-badge">{{ item.categoria }}</span>
                    </td>
                    <td>
                      <div class="warehouse-info">
                        <span class="warehouse-name">{{ item.almacen }}</span>
                        <span class="branch-name">{{ item.sede }}</span>
                      </div>
                    </td>
                    <td class="text-right">
                      <span class="stock-value" [class]="'stock-' + getAlertaClass(item.nivelAlerta)">
                        {{ item.stockActual | number:'1.0-2' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <span class="min-stock-value">{{ item.stockMinimo | number:'1.0-2' }}</span>
                    </td>
                    <td class="text-right">
                      <span class="price-value">S/ {{ item.precioUnitario | number:'1.2-2' }}</span>
                    </td>
                    <td class="text-right">
                      <strong class="total-value">S/ {{ (item.stockActual * item.precioUnitario) | number:'1.2-2' }}</strong>
                    </td>
                    <td>
                      <span [class]="'status-pill pill-' + getAlertaClass(item.nivelAlerta)">
                        {{ getAlertaLabel(item.nivelAlerta) }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="actions-wrapper">
                        <button
                          type="button"
                          class="action-btn"
                          (click)="prepararMovimiento(item)"
                          title="Registrar Movimiento"
                        >
                          <app-icon name="plus" [size]="15"></app-icon>
                        </button>
                        <button
                          type="button"
                          class="action-btn"
                          (click)="prepararAjuste(item)"
                          title="Ajuste de Stock"
                        >
                          <app-icon name="edit" [size]="15"></app-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }

    <!-- TAB 2: ALERTAS DE REPOSICIÓN -->
    @if (activeTab() === 'alertas') {
      <div class="content-card">
        <div class="section-top">
          <div>
            <h3 class="section-title">Productos en Nivel Crítico o de Reposición</h3>
            <p class="section-desc">Artículos cuyo stock actual es menor o igual al umbral mínimo de seguridad definido.</p>
          </div>
          <button type="button" class="btn-secondary" (click)="cargarAlertas()">
            <app-icon name="refresh" [size]="16"></app-icon>
            <span>Actualizar Alertas</span>
          </button>
        </div>

        @if (cargandoAlertas()) {
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Consultando alertas de existencias...</p>
          </div>
        } @else if (alertas().length === 0) {
          <div class="empty-box success">
            <app-icon name="check-circle" [size]="44"></app-icon>
            <h4>Todo el inventario está en niveles óptimos</h4>
            <p>No se encontraron productos por debajo del stock de seguridad.</p>
          </div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Almacén</th>
                  <th class="text-right">Stock Actual</th>
                  <th class="text-right">Stock Mínimo</th>
                  <th class="text-right">Déficit</th>
                  <th>Estado</th>
                  <th>Mensaje de Alerta</th>
                  <th class="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (alerta of alertas(); track alerta.idAlmacen + '-' + alerta.idProducto) {
                  <tr>
                    <td>
                      <span class="code-badge">{{ alerta.codigo }}</span>
                    </td>
                    <td>
                      <strong>{{ alerta.producto }}</strong>
                      <div class="unit-text">Unidad: {{ alerta.unidad }}</div>
                    </td>
                    <td>
                      <span>{{ alerta.almacen }}</span>
                    </td>
                    <td class="text-right">
                      <strong class="stock-danger">{{ alerta.stockActual | number:'1.0-2' }}</strong>
                    </td>
                    <td class="text-right">
                      <span>{{ alerta.stockMinimo | number:'1.0-2' }}</span>
                    </td>
                    <td class="text-right">
                      <span class="deficit-badge">-{{ alerta.diferencia | number:'1.0-2' }}</span>
                    </td>
                    <td>
                      <span [class]="'status-pill pill-' + getAlertaClass(alerta.nivelAlerta)">
                        {{ getAlertaLabel(alerta.nivelAlerta) }}
                      </span>
                    </td>
                    <td>
                      <span class="alert-message">{{ alerta.mensaje }}</span>
                    </td>
                    <td class="text-right">
                      <button
                        type="button"
                        class="btn-primary-sm"
                        (click)="abrirMovimientoParaAlerta(alerta)"
                      >
                        <app-icon name="plus" [size]="14"></app-icon>
                        <span>Reabastecer</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }

    <!-- TAB 3: HISTORIAL DE MOVIMIENTOS (KARDEX) -->
    @if (activeTab() === 'kardex') {
      <div class="content-card">
        <div class="section-top">
          <div>
            <h3 class="section-title">Registro Cronológico de Movimientos (Kardex)</h3>
            <p class="section-desc">Auditoría completa de ingresos por compras, salidas a despacho, mermas y ajustes.</p>
          </div>
          <button type="button" class="btn-secondary" (click)="cargarMovimientos()">
            <app-icon name="refresh" [size]="16"></app-icon>
            <span>Actualizar Kardex</span>
          </button>
        </div>

        @if (cargandoMovimientos()) {
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Cargando transacciones de kardex...</p>
          </div>
        } @else if (movimientos().length === 0) {
          <div class="empty-box">
            <app-icon name="reports" [size]="42"></app-icon>
            <h4>No hay movimientos registrados</h4>
            <p>Aún no se han ejecutado transacciones de inventario en el sistema.</p>
          </div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>N° Mov.</th>
                  <th>Fecha & Hora</th>
                  <th>Tipo de Transacción</th>
                  <th>Almacén</th>
                  <th>Items / Mercadería</th>
                  <th>Usuario Responsable</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                @for (mov of movimientos(); track mov.idMovimiento) {
                  <tr>
                    <td>
                      <span class="code-badge">#MOV-{{ mov.idMovimiento }}</span>
                    </td>
                    <td>
                      <span class="date-text">{{ mov.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
                    </td>
                    <td>
                      <span
                        class="nature-pill"
                        [class.nature-in]="mov.naturaleza === 'E'"
                        [class.nature-out]="mov.naturaleza === 'S'"
                      >
                        {{ mov.naturaleza === 'E' ? 'ENTRADA' : 'SALIDA' }} - {{ formatearTipoMov(mov.tipoMovimiento) }}
                      </span>
                    </td>
                    <td>
                      <span>{{ mov.almacen }}</span>
                    </td>
                    <td>
                      <div class="mov-items-list">
                        @for (it of mov.items; track it.idProducto) {
                          <div class="mov-item-line">
                            <span class="it-name">{{ it.producto }}</span>
                            <strong class="it-qty" [class.it-in]="mov.naturaleza === 'E'" [class.it-out]="mov.naturaleza === 'S'">
                              {{ mov.naturaleza === 'E' ? '+' : '-' }}{{ it.cantidad | number:'1.0-2' }}
                            </strong>
                            <span class="it-res">(Stock final: {{ it.stockResultante | number:'1.0-2' }})</span>
                          </div>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="user-name">{{ mov.usuario || 'Sistema' }}</span>
                    </td>
                    <td>
                      <span class="obs-text">{{ mov.observacion || 'Sin observaciones' }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }

    <!-- MODAL 1: REGISTRAR MOVIMIENTO (ENTRADA / SALIDA) -->
    @if (mostrarModalMovimiento()) {
      <div class="modal-backdrop" (click)="cerrarModalMovimiento()">
        <div class="modal-window" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Registrar Movimiento de Inventario</h3>
              <p>Registre una entrada o salida física de productos en almacén</p>
            </div>
            <button type="button" class="close-btn" (click)="cerrarModalMovimiento()">
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <form (ngSubmit)="guardarMovimiento()">
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label>Almacén <span class="required">*</span></label>
                  <select
                    [(ngModel)]="movFormAlmacenId"
                    name="movAlmacen"
                    required
                    class="form-control"
                    (ngModelChange)="actualizarStockReferencia()"
                  >
                    <option [ngValue]="null" disabled>Seleccione un almacén...</option>
                    @for (alm of almacenes(); track alm.idAlmacen) {
                      <option [ngValue]="alm.idAlmacen">{{ alm.nombre }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label>Tipo de Movimiento <span class="required">*</span></label>
                  <select
                    [(ngModel)]="movFormTipoId"
                    name="movTipo"
                    required
                    class="form-control"
                  >
                    <option [ngValue]="null" disabled>Seleccione el tipo...</option>
                    @for (tipo of tiposMovimiento(); track tipo.idTipoMovimiento) {
                      <option [ngValue]="tipo.idTipoMovimiento">
                        [{{ tipo.naturaleza === 'E' ? 'ENTRADA' : 'SALIDA' }}] {{ formatearTipoMov(tipo.nombre) }}
                      </option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Producto <span class="required">*</span></label>
                  <select
                    [(ngModel)]="movFormProductoId"
                    name="movProducto"
                    required
                    class="form-control"
                    (ngModelChange)="actualizarStockReferencia()"
                  >
                    <option [ngValue]="null" disabled>Seleccione un producto...</option>
                    @for (p of productos(); track p.idProducto) {
                      <option [ngValue]="p.idProducto">[{{ p.codigo }}] {{ p.nombre }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label>Cantidad <span class="required">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Ej. 100"
                    [(ngModel)]="movFormCantidad"
                    name="movCantidad"
                    required
                    class="form-control"
                  />
                </div>
              </div>

              <!-- Indicador de stock actual y proyectado -->
              @if (stockReferenciaActual() !== null) {
                <div class="stock-calc-box">
                  <div class="calc-row">
                    <span>Stock actual en almacén:</span>
                    <strong>{{ stockReferenciaActual() | number:'1.0-2' }}</strong>
                  </div>
                  @if (movFormCantidad && movFormCantidad > 0 && movFormTipoId) {
                    <div class="calc-row">
                      <span>Proyección tras movimiento:</span>
                      <strong [class.text-danger]="proyeccionStock() < 0">
                        {{ proyeccionStock() | number:'1.0-2' }}
                      </strong>
                    </div>
                  }
                </div>
              }

              <div class="form-group full-width">
                <label>Observaciones / Motivo</label>
                <textarea
                  rows="3"
                  placeholder="Detalles sobre el proveedor, factura o justificación del movimiento..."
                  [(ngModel)]="movFormObservacion"
                  name="movObs"
                  class="form-control"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="cerrarModalMovimiento()">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary"
                [disabled]="guardandoMovimiento() || !movFormAlmacenId || !movFormTipoId || !movFormProductoId || !movFormCantidad"
              >
                @if (guardandoMovimiento()) {
                  <span>Procesando...</span>
                } @else {
                  <app-icon name="check" [size]="16"></app-icon>
                  <span>Registrar Movimiento</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- MODAL 2: AJUSTE DIRECTO DE STOCK -->
    @if (mostrarModalAjuste()) {
      <div class="modal-backdrop" (click)="cerrarModalAjuste()">
        <div class="modal-window" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Ajuste Directo de Stock</h3>
              <p>Actualización manual de existencias tras inventario físico o balance</p>
            </div>
            <button type="button" class="close-btn" (click)="cerrarModalAjuste()">
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <form (ngSubmit)="guardarAjuste()">
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label>Almacén <span class="required">*</span></label>
                  <select
                    [(ngModel)]="ajusteAlmacenId"
                    name="ajusteAlmacen"
                    required
                    class="form-control"
                    (ngModelChange)="actualizarStockAjuste()"
                  >
                    <option [ngValue]="null" disabled>Seleccione un almacén...</option>
                    @for (alm of almacenes(); track alm.idAlmacen) {
                      <option [ngValue]="alm.idAlmacen">{{ alm.nombre }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label>Producto <span class="required">*</span></label>
                  <select
                    [(ngModel)]="ajusteProductoId"
                    name="ajusteProducto"
                    required
                    class="form-control"
                    (ngModelChange)="actualizarStockAjuste()"
                  >
                    <option [ngValue]="null" disabled>Seleccione un producto...</option>
                    @for (p of productos(); track p.idProducto) {
                      <option [ngValue]="p.idProducto">[{{ p.codigo }}] {{ p.nombre }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Indicador de comparación de stock -->
              @if (ajusteStockActual() !== null) {
                <div class="stock-calc-box">
                  <div class="calc-row">
                    <span>Stock registrado en sistema:</span>
                    <strong>{{ ajusteStockActual() | number:'1.0-2' }} unidades</strong>
                  </div>
                  @if (ajusteNuevoStock !== null && ajusteNuevoStock >= 0) {
                    <div class="calc-row">
                      <span>Diferencia de ajuste:</span>
                      <strong [class.text-danger]="diferenciaAjuste() < 0" [class.text-success]="diferenciaAjuste() >= 0">
                        {{ diferenciaAjuste() >= 0 ? '+' : '' }}{{ diferenciaAjuste() | number:'1.0-2' }} unidades
                      </strong>
                    </div>
                  }
                </div>
              }

              <div class="form-group">
                <label>Nuevo Stock Físico <span class="required">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Cantidad real verificada"
                  [(ngModel)]="ajusteNuevoStock"
                  name="nuevoStock"
                  required
                  class="form-control"
                />
              </div>

              <div class="form-group full-width">
                <label>Motivo o Justificación del Ajuste <span class="required">*</span></label>
                <textarea
                  rows="3"
                  placeholder="Ej. Conteo físico trimestral, regularización de mermas, etc."
                  [(ngModel)]="ajusteMotivo"
                  name="ajusteMotivo"
                  required
                  class="form-control"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="cerrarModalAjuste()">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary"
                [disabled]="guardandoAjuste() || !ajusteAlmacenId || !ajusteProductoId || ajusteNuevoStock === null || !ajusteMotivo"
              >
                @if (guardandoAjuste()) {
                  <span>Guardando...</span>
                } @else {
                  <app-icon name="check" [size]="16"></app-icon>
                  <span>Confirmar Ajuste</span>
                }
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

    /* Acciones del header */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
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
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(24, 214, 0, 0.25);
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #15b800;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(24, 214, 0, 0.35);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0.625rem 1.125rem;
      background-color: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background-color: #f8fafc;
      border-color: #94a3b8;
      color: #0f172a;
    }

    .btn-primary-sm {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0.375rem 0.75rem;
      background-color: #18d600;
      color: #052e16;
      border: none;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.775rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary-sm:hover {
      background-color: #15b800;
    }

    /* Alertas */
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
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
      transition: all 0.2s ease;
    }

    .stat-card.has-warning {
      border-color: #fde047;
      background: #fffbeb;
    }

    .stat-card.has-danger {
      border-color: #fca5a5;
      background: #fef2f2;
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

    .icon-total {
      background: rgba(37, 99, 235, 0.1);
      color: #2563eb;
    }

    .icon-normal {
      background: rgba(24, 214, 0, 0.12);
      color: #15803d;
    }

    .icon-warning {
      background: rgba(234, 179, 8, 0.15);
      color: #b45309;
    }

    .icon-danger {
      background: rgba(239, 68, 68, 0.12);
      color: #dc2626;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: #64748b;
      margin-top: 2px;
    }

    /* Tabs */
    .tabs-container {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0.75rem 1.25rem;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      color: #0f172a;
    }

    .tab-btn.active {
      color: #0f172a;
      border-bottom-color: #18d600;
      font-weight: 700;
    }

    .tab-badge {
      padding: 2px 7px;
      border-radius: 999px;
      background-color: #f1f5f9;
      color: #475569;
      font-size: 0.725rem;
      font-weight: 700;
    }

    .tab-badge.warning {
      background-color: #fef3c7;
      color: #b45309;
    }

    /* Card de Contenido */
    .content-card {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    }

    /* Barra de filtros */
    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 1.25rem;
    }

    .search-input-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.5rem 0.875rem;
      flex: 1;
      min-width: 260px;
    }

    .search-input-wrapper input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.875rem;
      color: #0f172a;
      width: 100%;
    }

    .select-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
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

    .checkbox-filter {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.825rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
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

    /* Tabla */
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

    .text-right {
      text-align: right;
    }

    .code-badge {
      display: inline-block;
      padding: 2px 7px;
      background-color: #f1f5f9;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.775rem;
      color: #334155;
      font-family: monospace;
    }

    .product-info strong {
      display: block;
      color: #0f172a;
      font-size: 0.875rem;
    }

    .unit-text {
      font-size: 0.75rem;
      color: #64748b;
    }

    .category-badge {
      display: inline-block;
      padding: 2px 8px;
      background-color: #e0f2fe;
      color: #0369a1;
      border-radius: 6px;
      font-size: 0.775rem;
      font-weight: 600;
    }

    .warehouse-info {
      display: flex;
      flex-direction: column;
    }

    .warehouse-name {
      font-weight: 600;
      color: #1e293b;
    }

    .branch-name {
      font-size: 0.75rem;
      color: #64748b;
    }

    .stock-value {
      font-size: 1rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
    }

    .stock-normal {
      color: #15803d;
    }

    .stock-warning {
      color: #b45309;
      background-color: #fef3c7;
    }

    .stock-danger {
      color: #b91c1c;
      background-color: #fee2e2;
    }

    .min-stock-value {
      color: #64748b;
      font-weight: 600;
    }

    .price-value {
      color: #334155;
    }

    .total-value {
      color: #0f172a;
    }

    .status-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .pill-normal {
      background-color: #dcfce7;
      color: #166534;
    }

    .pill-warning {
      background-color: #fef3c7;
      color: #b45309;
    }

    .pill-danger {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .actions-wrapper {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .action-btn {
      width: 32px;
      height: 32px;
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

    .action-btn:hover {
      background-color: #f1f5f9;
      color: #0f172a;
      border-color: #94a3b8;
    }

    /* Sección Top para Tab 2 y 3 */
    .section-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .section-desc {
      font-size: 0.825rem;
      color: #64748b;
      margin-top: 2px;
    }

    .deficit-badge {
      display: inline-block;
      padding: 2px 6px;
      background-color: #fee2e2;
      color: #991b1b;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.825rem;
    }

    .alert-message {
      font-size: 0.825rem;
      color: #64748b;
    }

    /* Kardex styles */
    .nature-pill {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.725rem;
      font-weight: 700;
    }

    .nature-in {
      background-color: #dcfce7;
      color: #15803d;
    }

    .nature-out {
      background-color: #fee2e2;
      color: #b91c1c;
    }

    .mov-items-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .mov-item-line {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.825rem;
    }

    .it-name {
      color: #1e293b;
      font-weight: 500;
    }

    .it-qty {
      font-weight: 700;
    }

    .it-in {
      color: #15803d;
    }

    .it-out {
      color: #dc2626;
    }

    .it-res {
      font-size: 0.725rem;
      color: #64748b;
    }

    .date-text {
      font-size: 0.825rem;
      color: #475569;
    }

    .user-name {
      font-weight: 600;
      color: #334155;
    }

    .obs-text {
      font-size: 0.8rem;
      color: #64748b;
      font-style: italic;
    }

    /* Empty and Loading States */
    .loading-box, .empty-box {
      padding: 3rem 1rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #64748b;
    }

    .empty-box h4 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 10px 0 4px;
    }

    .empty-box p {
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }

    .empty-box.success {
      color: #16a34a;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #18d600;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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
      max-width: 580px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
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

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 0.825rem;
      font-weight: 600;
      color: #334155;
    }

    .required {
      color: #dc2626;
    }

    .form-control {
      padding: 0.625rem 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #0f172a;
      background: #ffffff;
      outline: none;
      transition: border-color 0.15s;
    }

    .form-control:focus {
      border-color: #18d600;
      box-shadow: 0 0 0 3px rgba(24, 214, 0, 0.15);
    }

    .stock-calc-box {
      background-color: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.825rem;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      color: #475569;
    }

    .calc-row strong {
      color: #0f172a;
    }

    .text-danger {
      color: #dc2626 !important;
    }

    .text-success {
      color: #16a34a !important;
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
  `]
})
export class InventoryListPageComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private almacenesService = inject(AlmacenesService);
  private categoriasService = inject(CategoriasService);
  private productosService = inject(ProductosService);

  // Estados de datos
  activeTab = signal<InventoryTab>('stock');
  items = signal<InventarioItem[]>([]);
  consulta = signal<InventarioConsulta | null>(null);
  alertas = signal<AlertaStock[]>([]);
  movimientos = signal<MovimientoResponse[]>([]);
  almacenes = signal<Almacen[]>([]);
  categorias = signal<Categoria[]>([]);
  productos = signal<Producto[]>([]);
  tiposMovimiento = signal<TipoMovimiento[]>([]);

  // Estados de carga
  cargando = signal<boolean>(false);
  cargandoAlertas = signal<boolean>(false);
  cargandoMovimientos = signal<boolean>(false);
  guardandoMovimiento = signal<boolean>(false);
  guardandoAjuste = signal<boolean>(false);

  // Mensajes de feedback
  mensaje = signal<string | null>(null);
  error = signal<string | null>(null);

  // Filtros
  filtroTexto: string = '';
  filtroAlmacenId: number | null = null;
  filtroCategoriaId: number | null = null;
  filtroSoloBajoStock: boolean = false;

  // Modales
  mostrarModalMovimiento = signal<boolean>(false);
  mostrarModalAjuste = signal<boolean>(false);

  // Formulario de Movimiento
  movFormAlmacenId: number | null = null;
  movFormTipoId: number | null = null;
  movFormProductoId: number | null = null;
  movFormCantidad: number | null = null;
  movFormObservacion: string = '';
  stockReferenciaActual = signal<number | null>(null);

  // Formulario de Ajuste de Stock
  ajusteAlmacenId: number | null = null;
  ajusteProductoId: number | null = null;
  ajusteStockActual = signal<number | null>(null);
  ajusteNuevoStock: number | null = null;
  ajusteMotivo: string = '';

  // Filtros locales reactivos
  itemsFiltrados = computed(() => {
    let list = this.items();
    const query = this.filtroTexto.trim().toLowerCase();
    if (query) {
      list = list.filter(item =>
        item.codigo.toLowerCase().includes(query) ||
        item.producto.toLowerCase().includes(query) ||
        item.categoria.toLowerCase().includes(query) ||
        item.almacen.toLowerCase().includes(query) ||
        item.sede.toLowerCase().includes(query)
      );
    }
    return list;
  });

  // KPIs computados
  totalProductosKPI = computed(() => {
    if (this.consulta()) {
      return this.consulta()!.totalProductos;
    }
    return this.items().length;
  });

  totalBajoStockKPI = computed(() => {
    if (this.consulta()) {
      return this.consulta()!.totalBajoStock;
    }
    return this.items().filter(i => i.nivelAlerta === 'BAJO_STOCK').length;
  });

  totalSinStockKPI = computed(() => {
    if (this.consulta()) {
      return this.consulta()!.totalSinStock;
    }
    return this.items().filter(i => i.nivelAlerta === 'SIN_STOCK').length;
  });

  totalNormalKPI = computed(() => {
    return this.items().filter(i => i.nivelAlerta === 'NORMAL').length;
  });

  proyeccionStock = computed(() => {
    const actual = this.stockReferenciaActual() ?? 0;
    const qty = this.movFormCantidad ?? 0;
    const tipo = this.tiposMovimiento().find(t => t.idTipoMovimiento === this.movFormTipoId);
    if (!tipo) return actual;
    return tipo.naturaleza === 'E' ? (actual + qty) : (actual - qty);
  });

  diferenciaAjuste = computed(() => {
    const actual = this.ajusteStockActual() ?? 0;
    const nuevo = this.ajusteNuevoStock ?? 0;
    return nuevo - actual;
  });

  ngOnInit(): void {
    this.cargarCatalogosAuxiliares();
    this.recargarInventario();
  }

  cambiarTab(tab: InventoryTab): void {
    this.activeTab.set(tab);
    if (tab === 'alertas' && this.alertas().length === 0) {
      this.cargarAlertas();
    } else if (tab === 'kardex' && this.movimientos().length === 0) {
      this.cargarMovimientos();
    }
  }

  cargarCatalogosAuxiliares(): void {
    this.almacenesService.listar().subscribe({
      next: data => this.almacenes.set(data),
      error: err => console.warn('Error cargando almacenes:', err)
    });

    this.categoriasService.listar().subscribe({
      next: data => this.categorias.set(data),
      error: err => console.warn('Error cargando categorías:', err)
    });

    this.productosService.listar().subscribe({
      next: data => this.productos.set(data),
      error: err => console.warn('Error cargando productos:', err)
    });

    this.inventoryService.obtenerTiposMovimiento().subscribe({
      next: data => this.tiposMovimiento.set(data),
      error: err => console.warn('Error cargando tipos de movimiento:', err)
    });
  }

  recargarInventario(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.inventoryService.consultarInventario({
      idAlmacen: this.filtroAlmacenId || undefined,
      idCategoria: this.filtroCategoriaId || undefined,
      soloBajoStock: this.filtroSoloBajoStock,
      buscar: this.filtroTexto || undefined
    }).subscribe({
      next: res => {
        this.consulta.set(res);
        this.items.set(res.items || []);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Error al consultar inventario en el servidor');
        this.cargando.set(false);
      }
    });
  }

  cargarAlertas(): void {
    this.cargandoAlertas.set(true);
    this.inventoryService.obtenerAlertas(
      this.filtroAlmacenId || undefined,
      this.filtroCategoriaId || undefined
    ).subscribe({
      next: data => {
        this.alertas.set(data || []);
        this.cargandoAlertas.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Error al obtener alertas de stock');
        this.cargandoAlertas.set(false);
      }
    });
  }

  cargarMovimientos(): void {
    this.cargandoMovimientos.set(true);
    this.inventoryService.obtenerHistorialMovimientos(
      this.filtroAlmacenId || undefined
    ).subscribe({
      next: data => {
        this.movimientos.set(data || []);
        this.cargandoMovimientos.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Error al obtener historial de movimientos');
        this.cargandoMovimientos.set(false);
      }
    });
  }

  aplicarFiltrosLocales(): void {
    // Computed itemsFiltrados se actualiza automáticamente
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroAlmacenId = null;
    this.filtroCategoriaId = null;
    this.filtroSoloBajoStock = false;
    this.recargarInventario();
  }

  // Métodos de Modales
  abrirModalMovimiento(): void {
    this.movFormAlmacenId = this.filtroAlmacenId || (this.almacenes().length > 0 ? this.almacenes()[0].idAlmacen : null);
    this.movFormTipoId = this.tiposMovimiento().length > 0 ? this.tiposMovimiento()[0].idTipoMovimiento : null;
    this.movFormProductoId = this.productos().length > 0 ? this.productos()[0].idProducto : null;
    this.movFormCantidad = null;
    this.movFormObservacion = '';
    this.actualizarStockReferencia();
    this.mostrarModalMovimiento.set(true);
  }

  cerrarModalMovimiento(): void {
    this.mostrarModalMovimiento.set(false);
    this.stockReferenciaActual.set(null);
  }

  prepararMovimiento(item: InventarioItem): void {
    this.movFormAlmacenId = item.idAlmacen;
    this.movFormProductoId = item.idProducto;
    this.movFormTipoId = this.tiposMovimiento().length > 0 ? this.tiposMovimiento()[0].idTipoMovimiento : null;
    this.movFormCantidad = null;
    this.movFormObservacion = '';
    this.stockReferenciaActual.set(item.stockActual);
    this.mostrarModalMovimiento.set(true);
  }

  abrirMovimientoParaAlerta(alerta: AlertaStock): void {
    this.movFormAlmacenId = alerta.idAlmacen;
    this.movFormProductoId = alerta.idProducto;
    // Seleccionar tipo de entrada por defecto
    const tipoEntrada = this.tiposMovimiento().find(t => t.naturaleza === 'E');
    this.movFormTipoId = tipoEntrada ? tipoEntrada.idTipoMovimiento : (this.tiposMovimiento()[0]?.idTipoMovimiento ?? null);
    this.movFormCantidad = alerta.diferencia > 0 ? alerta.diferencia : 10;
    this.movFormObservacion = 'Reposición por stock bajo según alerta RF-08';
    this.stockReferenciaActual.set(alerta.stockActual);
    this.mostrarModalMovimiento.set(true);
  }

  actualizarStockReferencia(): void {
    if (!this.movFormAlmacenId || !this.movFormProductoId) {
      this.stockReferenciaActual.set(null);
      return;
    }
    const item = this.items().find(i => i.idAlmacen === this.movFormAlmacenId && i.idProducto === this.movFormProductoId);
    if (item) {
      this.stockReferenciaActual.set(item.stockActual);
    } else {
      this.inventoryService.obtenerStockProducto(this.movFormAlmacenId, this.movFormProductoId).subscribe({
        next: data => this.stockReferenciaActual.set(data.stockActual),
        error: () => this.stockReferenciaActual.set(0)
      });
    }
  }

  guardarMovimiento(): void {
    if (!this.movFormAlmacenId || !this.movFormTipoId || !this.movFormProductoId || !this.movFormCantidad) {
      return;
    }

    this.guardandoMovimiento.set(true);
    this.error.set(null);

    const payload: MovimientoRequest = {
      idAlmacen: this.movFormAlmacenId,
      idTipoMovimiento: this.movFormTipoId,
      observacion: this.movFormObservacion || undefined,
      items: [
        {
          idProducto: this.movFormProductoId,
          cantidad: this.movFormCantidad
        }
      ]
    };

    this.inventoryService.registrarMovimiento(payload).subscribe({
      next: res => {
        this.guardandoMovimiento.set(false);
        this.cerrarModalMovimiento();
        this.mostrarMensaje('Movimiento de inventario registrado correctamente');
        this.recargarInventario();
        this.cargarMovimientos();
        this.cargarAlertas();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoMovimiento.set(false);
        this.error.set(err.error?.message || 'Error al registrar el movimiento en almacén');
      }
    });
  }

  // Métodos de Ajuste Directo de Stock
  abrirModalAjuste(): void {
    this.ajusteAlmacenId = this.filtroAlmacenId || (this.almacenes().length > 0 ? this.almacenes()[0].idAlmacen : null);
    this.ajusteProductoId = this.productos().length > 0 ? this.productos()[0].idProducto : null;
    this.ajusteNuevoStock = null;
    this.ajusteMotivo = '';
    this.actualizarStockAjuste();
    this.mostrarModalAjuste.set(true);
  }

  prepararAjuste(item: InventarioItem): void {
    this.ajusteAlmacenId = item.idAlmacen;
    this.ajusteProductoId = item.idProducto;
    this.ajusteStockActual.set(item.stockActual);
    this.ajusteNuevoStock = item.stockActual;
    this.ajusteMotivo = 'Conteo físico de inventario';
    this.mostrarModalAjuste.set(true);
  }

  cerrarModalAjuste(): void {
    this.mostrarModalAjuste.set(false);
    this.ajusteStockActual.set(null);
  }

  actualizarStockAjuste(): void {
    if (!this.ajusteAlmacenId || !this.ajusteProductoId) {
      this.ajusteStockActual.set(null);
      return;
    }
    const item = this.items().find(i => i.idAlmacen === this.ajusteAlmacenId && i.idProducto === this.ajusteProductoId);
    if (item) {
      this.ajusteStockActual.set(item.stockActual);
      if (this.ajusteNuevoStock === null) {
        this.ajusteNuevoStock = item.stockActual;
      }
    } else {
      this.inventoryService.obtenerStockProducto(this.ajusteAlmacenId, this.ajusteProductoId).subscribe({
        next: data => {
          this.ajusteStockActual.set(data.stockActual);
          if (this.ajusteNuevoStock === null) {
            this.ajusteNuevoStock = data.stockActual;
          }
        },
        error: () => this.ajusteStockActual.set(0)
      });
    }
  }

  guardarAjuste(): void {
    if (!this.ajusteAlmacenId || !this.ajusteProductoId || this.ajusteNuevoStock === null || !this.ajusteMotivo) {
      return;
    }

    this.guardandoAjuste.set(true);
    this.error.set(null);

    const payload: AjusteStockRequest = {
      idAlmacen: this.ajusteAlmacenId,
      idProducto: this.ajusteProductoId,
      nuevoStock: this.ajusteNuevoStock,
      motivo: this.ajusteMotivo
    };

    this.inventoryService.ajustarStock(payload).subscribe({
      next: () => {
        this.guardandoAjuste.set(false);
        this.cerrarModalAjuste();
        this.mostrarMensaje('Ajuste de stock guardado exitosamente');
        this.recargarInventario();
        this.cargarMovimientos();
        this.cargarAlertas();
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoAjuste.set(false);
        this.error.set(err.error?.message || 'Error al ejecutar el ajuste de stock');
      }
    });
  }

  mostrarMensaje(msg: string): void {
    this.mensaje.set(msg);
    setTimeout(() => {
      if (this.mensaje() === msg) {
        this.mensaje.set(null);
      }
    }, 4500);
  }

  // Helpers de Formato y Estilos
  getAlertaClass(nivel: string | undefined): string {
    switch (nivel) {
      case 'SIN_STOCK':
        return 'danger';
      case 'BAJO_STOCK':
        return 'warning';
      case 'NORMAL':
      default:
        return 'normal';
    }
  }

  getAlertaLabel(nivel: string | undefined): string {
    switch (nivel) {
      case 'SIN_STOCK':
        return 'Sin Stock';
      case 'BAJO_STOCK':
        return 'Bajo Stock';
      case 'NORMAL':
      default:
        return 'Normal';
    }
  }

  formatearTipoMov(nombre: string | undefined): string {
    if (!nombre) return '';
    return nombre
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}
