import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ReportesService } from '../../reportes.service';
import {
  AlmacenOpcion,
  CategoriaOpcion,
  FiltrosReporte,
  FormatoReporte,
  ReporteInventario,
} from '../../reporte-inventario.model';

@Component({
  selector: 'app-reporte-inventario-page',
  standalone: true,
  imports: [FormsModule, RouterModule, DatePipe, DecimalPipe, PageHeaderComponent],
  template: `
    <app-page-header title="Reporte de Inventario" subtitle="Stock actual por producto, categoría y almacén">
      <button class="btn-secondary" [disabled]="descargando() !== null" (click)="descargar('excel')">
        {{ descargando() === 'excel' ? 'Generando...' : 'Descargar Excel' }}
      </button>
      <button class="btn-primary" [disabled]="descargando() !== null" (click)="descargar('pdf')">
        {{ descargando() === 'pdf' ? 'Generando...' : 'Descargar PDF' }}
      </button>
    </app-page-header>

    <!-- Navegación entre módulos de reportes -->
    <nav class="reportes-nav">
      <a routerLink="/app/reportes/inventario" routerLinkActive="active" class="nav-tab">
        Reporte de Inventario
      </a>
      <a routerLink="/app/reportes/pedidos" routerLinkActive="active" class="nav-tab">
        Reporte de Pedidos
      </a>
      <a routerLink="/app/reportes/entregas" routerLinkActive="active" class="nav-tab">
        Reporte de Entregas & Cumplimiento
      </a>
    </nav>

    @if (error()) {
      <div class="alert err">{{ error() }}</div>
    }

    <div class="content-card">
      <div class="toolbar">
        <label>Almacén
          <select name="idAlmacen" [ngModel]="filtros.idAlmacen" (ngModelChange)="filtrar({ idAlmacen: $event })">
            <option [ngValue]="null">Todos</option>
            @for (a of almacenes(); track a.idAlmacen) {
              <option [ngValue]="a.idAlmacen">{{ a.nombre }}</option>
            }
          </select>
        </label>
        <label>Categoría
          <select name="idCategoria" [ngModel]="filtros.idCategoria" (ngModelChange)="filtrar({ idCategoria: $event })">
            <option [ngValue]="null">Todas</option>
            @for (c of categorias(); track c.idCategoria) {
              <option [ngValue]="c.idCategoria">{{ c.nombre }}</option>
            }
          </select>
        </label>
      </div>

      @if (reporte(); as r) {
        <p class="resumen">
          Generado: <strong>{{ r.generadoEn | date: 'dd/MM/yyyy HH:mm' }}</strong>
          · Registros: <strong>{{ r.totalRegistros }}</strong>
          · Con stock bajo: <strong>{{ r.totalBajoStock }}</strong>
        </p>
      }

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Almacén</th><th>Sede</th><th>Código</th><th>Producto</th><th>Categoría</th>
              <th>Unidad</th><th class="num">Stock actual</th><th class="num">Stock mínimo</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
                        @if (cargando()) {
              <tr>
                <td colspan="9">
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <span>Cargando información...</span>
                  </div>
                </td>
              </tr>
            } @else {
            @for (i of reporte()?.items ?? []; track i.idAlmacen + '-' + i.idProducto) {
              <tr [class.bajo]="i.bajoStock">
                <td>{{ i.almacen }}</td>
                <td>{{ i.sede }}</td>
                <td>{{ i.codigo }}</td>
                <td><strong>{{ i.producto }}</strong></td>
                <td>{{ i.categoria }}</td>
                <td>{{ i.unidad }}</td>
                <td class="num">{{ i.stockActual | number: '1.2-2' }}</td>
                <td class="num">{{ i.stockMinimo | number: '1.2-2' }}</td>
                <td><span class="badge" [class.off]="i.bajoStock">{{ i.bajoStock ? 'Stock bajo' : 'OK' }}</span></td>
              </tr>
            } @empty {
                <tr><td colspan="9">No hay registros de inventario para los filtros seleccionados.</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .reportes-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 1.5rem;
      padding-bottom: 0.25rem;
    }
    .nav-tab {
      padding: 0.6rem 1.25rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: #64748b;
      text-decoration: none;
      border-radius: 8px 8px 0 0;
      transition: all 0.2s ease;
      border-bottom: 3px solid transparent;
      margin-bottom: -4px;
    }
    .nav-tab:hover {
      color: #0f172a;
      background: #f8fafc;
    }
    .nav-tab.active {
      color: #052e16;
      border-bottom-color: var(--primary-color, #18d600);
      background: #f0fdf4;
    }
    .content-card { background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
    .btn-primary { padding: 0.5rem 1rem; background: var(--primary-color, #18d600); color: #052e16; border: none; border-radius: 9px; box-shadow: 0 4px 12px var(--primary-glow); font-weight: 600; cursor: pointer; }
    .btn-secondary { padding: 0.5rem 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 9px; color: #334155; font-weight: 600; cursor: pointer; }
    .btn-primary, .btn-secondary { white-space: nowrap; }
    .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }
    .toolbar { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 280px)); gap: 1rem; margin-bottom: 1rem; }
    .toolbar label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: #475569; }
    .toolbar select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; }
    .resumen { margin: 0 0 1rem; font-size: 0.875rem; color: #475569; }
    .table-wrap { overflow-x: auto; contain: inline-size; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .data-table th { color: #475569; background: #f8fafc; font-weight: 600; white-space: nowrap; }
    .data-table .num { text-align: right; white-space: nowrap; }
    .data-table tr.bajo td { background: #fef2f2; }
    .badge { padding: 0.15rem 0.6rem; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 0.8rem; white-space: nowrap; }
    .badge.off { background: #fee2e2; color: #991b1b; }
    .alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert.err { background: #fee2e2; color: #991b1b; }
  `],
})
export class ReporteInventarioPageComponent implements OnInit {
  private service = inject(ReportesService);
  private consulta?: Subscription;

  reporte = signal<ReporteInventario | null>(null);
  almacenes = signal<AlmacenOpcion[]>([]);
  categorias = signal<CategoriaOpcion[]>([]);

  cargando = signal(false);
  descargando = signal<FormatoReporte | null>(null);
  error = signal('');

  filtros: FiltrosReporte = { idAlmacen: null, idCategoria: null };

  ngOnInit(): void {
    this.service.almacenes().subscribe({
      next: data => this.almacenes.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar los almacenes'),
    });
    this.service.categorias().subscribe({
      next: data => this.categorias.set(data),
      error: err => this.mostrarError(err, 'No se pudieron cargar las categorías'),
    });
    this.cargar();
  }

  cargar(): void {
    // Si cambian los filtros, la respuesta anterior ya no debe mostrarse
    this.consulta?.unsubscribe();
    this.error.set('');
    this.cargando.set(true);
    this.consulta = this.service.inventario(this.filtros).subscribe({
      next: data => {
        this.reporte.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.reporte.set(null);
        this.cargando.set(false);
        this.mostrarError(err, 'No se pudo cargar el reporte');
      },
    });
  }

  filtrar(cambio: Partial<FiltrosReporte>): void {
    this.filtros = { ...this.filtros, ...cambio };
    this.cargar();
  }

  descargar(formato: FormatoReporte): void {
    this.error.set('');
    this.descargando.set(formato);
    this.service.descargarInventario(formato, this.filtros).subscribe({
      next: archivo => {
        this.guardarArchivo(archivo, formato);
        this.descargando.set(null);
      },
      error: err => {
        this.descargando.set(null);
        this.mostrarErrorDescarga(err, formato);
      },
    });
  }

  private guardarArchivo(archivo: Blob, formato: FormatoReporte): void {
    const fecha = formatDate(new Date(), 'yyyyMMdd_HHmm', 'en-US');
    const extension = formato === 'pdf' ? 'pdf' : 'xlsx';
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte_inventario_${fecha}.${extension}`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  // Con responseType blob, el cuerpo del error también llega como Blob
  private async mostrarErrorDescarga(err: HttpErrorResponse, formato: FormatoReporte): Promise<void> {
    const porDefecto = `No se pudo descargar el ${formato === 'pdf' ? 'PDF' : 'Excel'}`;
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

  private mostrarError(err: HttpErrorResponse, porDefecto: string): void {
    const detalle = err.error?.mensaje ?? err.error?.message ?? err.error?.error;
    this.error.set(detalle ? `${porDefecto}: ${detalle}` : `${porDefecto} (HTTP ${err.status})`);
  }
}
