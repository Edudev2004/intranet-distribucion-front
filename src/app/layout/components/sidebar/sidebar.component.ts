import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
}

export interface NavSection {
  id: string;
  title: string;
  collapsed?: boolean;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <!-- Header de la barra lateral -->
      <div class="sidebar-header" (click)="toggleCollapse()">
        <div class="brand-box">
          @if (!collapsed) {
            <img src="enruta.webp" alt="EnRuta" class="sidebar-logo-img" />
          } @else {
            <div class="brand-icon-wrapper">
              <app-icon name="truck" [size]="20"></app-icon>
            </div>
          }
        </div>
        <button
          type="button"
          class="collapse-btn"
          [attr.title]="collapsed ? 'Expandir menú' : 'Colapsar menú'"
          (click)="$event.stopPropagation(); toggleCollapse()"
        >
          <app-icon [name]="collapsed ? 'chevron-right' : 'chevron-left'" [size]="16"></app-icon>
        </button>
      </div>

      <!-- Navegación con Scroll -->
      <div class="sidebar-scroll">
        <nav class="sidebar-nav">
          @if (!collapsed) {
            <!-- Módulos organizados en Secciones Desplegables -->
            @for (section of sections; track section.id) {
              <div class="nav-section">
                <button
                  type="button"
                  class="section-header-btn"
                  (click)="toggleSection(section)"
                  [attr.aria-expanded]="!section.collapsed"
                >
                  <span class="section-title">{{ section.title }}</span>
                  <app-icon
                    [name]="section.collapsed ? 'chevron-right' : 'chevron-down'"
                    [size]="13"
                    class="section-chevron"
                  ></app-icon>
                </button>

                @if (!section.collapsed) {
                  <div class="section-items">
                    @for (item of section.items; track item.route) {
                      <a
                        [routerLink]="item.route"
                        routerLinkActive="active"
                        class="nav-item"
                      >
                        <div class="item-icon">
                          <app-icon [name]="item.icon" [size]="18"></app-icon>
                        </div>
                        <span class="nav-label">{{ item.label }}</span>
                        @if (item.badge) {
                          <span class="nav-badge">{{ item.badge }}</span>
                        }
                      </a>
                    }
                  </div>
                }
              </div>
            }
          } @else {
            <!-- Modo Colapsado (Íconos agrupados con divisores) -->
            @for (section of sections; track section.id; let last = $last) {
              <div class="collapsed-section">
                @for (item of section.items; track item.route) {
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="active"
                    class="nav-item compact"
                    [attr.title]="item.label"
                  >
                    <div class="item-icon">
                      <app-icon [name]="item.icon" [size]="19"></app-icon>
                    </div>
                  </a>
                }
              </div>
              @if (!last) {
                <div class="collapsed-divider"></div>
              }
            }
          }
        </nav>
      </div>

      <!-- Footer inferior del sidebar -->
      <div class="sidebar-footer">
        <div class="status-indicator">
          <span class="dot"></span>
          @if (!collapsed) {
            <div class="status-text">
              <span class="sys-status">API Online</span>
              <span class="sys-version">v2.4.0</span>
            </div>
          }
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      background-color: #0b1120;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 100;
      box-shadow: 2px 0 16px rgba(0, 0, 0, 0.15);
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
    }

    .sidebar.collapsed {
      width: 78px;
    }

    /* ── HEADER ── */
    .sidebar-header {
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 18px;
      background-color: #0f172a;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      cursor: pointer;
    }

    .brand-box {
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
    }

    .sidebar-logo-img {
      max-height: 38px;
      max-width: 155px;
      object-fit: contain;
      display: block;
    }

    .brand-icon-wrapper {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(24, 214, 0, 0.15);
      border: 1px solid rgba(24, 214, 0, 0.3);
      color: #18d600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .collapse-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      border-radius: 8px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .collapse-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    .sidebar.collapsed .sidebar-header {
      justify-content: center;
      padding: 0;
    }

    .sidebar.collapsed .collapse-btn {
      display: none;
    }

    /* ── SCROLL & NAVEGACIÓN ── */
    .sidebar-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 14px 0;
    }

    .sidebar-scroll::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 0 10px;
    }

    /* Secciones Organizacionales */
    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .section-header-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px 6px;
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      border-radius: 6px;
      transition: color 0.15s ease, background-color 0.15s ease;
    }

    .section-header-btn:hover {
      color: #cbd5e1;
      background-color: rgba(255, 255, 255, 0.03);
    }

    .section-title {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .section-chevron {
      color: #475569;
      transition: transform 0.2s ease;
    }

    .section-header-btn:hover .section-chevron {
      color: #94a3b8;
    }

    .section-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    /* Elementos de Navegación */
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 12px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.18s ease;
      white-space: nowrap;
    }

    .item-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 20px;
    }

    .nav-label {
      flex: 1;
    }

    .nav-badge {
      padding: 2px 7px;
      border-radius: 999px;
      background: rgba(24, 214, 0, 0.15);
      color: #18d600;
      font-size: 10.5px;
      font-weight: 700;
    }

    .nav-item:hover {
      background-color: rgba(24, 214, 0, 0.08);
      color: #ffffff;
      transform: translateX(2px);
    }

    .nav-item.active {
      background-color: #18d600;
      color: #052e16;
      font-weight: 750;
      box-shadow: 0 4px 12px rgba(24, 214, 0, 0.3);
      transform: none;
    }

    .nav-item.active .item-icon {
      color: #052e16;
    }

    /* Colapsado */
    .collapsed-section {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .nav-item.compact {
      justify-content: center;
      padding: 11px 0;
      border-radius: 9px;
    }

    .nav-item.compact:hover {
      transform: none;
    }

    .collapsed-divider {
      height: 1px;
      background-color: rgba(255, 255, 255, 0.07);
      margin: 4px 12px;
    }

    /* ── FOOTER ── */
    .sidebar-footer {
      padding: 14px 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      background-color: rgba(15, 23, 42, 0.4);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .dot {
      width: 9px;
      height: 9px;
      background-color: #18d600;
      border-radius: 50%;
      box-shadow: 0 0 10px #18d600;
      flex-shrink: 0;
    }

    .status-text {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;
    }

    .sys-status {
      font-size: 12px;
      font-weight: 600;
      color: #cbd5e1;
    }

    .sys-version {
      font-size: 11px;
      color: #64748b;
    }

    .sidebar.collapsed .sidebar-footer {
      justify-content: center;
      padding: 14px 0;
    }

    .sidebar.collapsed .status-indicator {
      justify-content: center;
    }
  `]
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  sections: NavSection[] = [
    {
      id: 'principal',
      title: 'Principal',
      collapsed: false,
      items: [
        { label: 'Dashboard', route: '/app/dashboard', icon: 'dashboard' }
      ]
    },
    {
      id: 'almacen',
      title: 'Almacén & Stock',
      collapsed: false,
      items: [
        { label: 'Sedes', route: '/app/sedes', icon: 'warehouse' },
        { label: 'Almacenes', route: '/app/almacenes', icon: 'warehouse' },
        { label: 'Categorías', route: '/app/categorias', icon: 'tag' },
        { label: 'Control de Inventario', route: '/app/inventory', icon: 'inventory' }
      ]
    },
    {
      id: 'ventas',
      title: 'Ventas & Facturación',
      collapsed: false,
      items: [
        { label: 'Clientes', route: '/app/clientes', icon: 'users' },
        { label: 'Pedidos', route: '/app/pedidos', icon: 'orders' },
        { label: 'Facturación & Guías', route: '/app/facturacion', icon: 'invoice' }
      ]
    },
    {
      id: 'distribucion',
      title: 'Distribución & Logística',
      collapsed: false,
      items: [
        { label: 'Zonas de Reparto', route: '/app/zonas', icon: 'map-pin' },
        { label: 'Rutas de Distribución', route: '/app/rutas', icon: 'route' },
        { label: 'Programación de Rutas', route: '/app/programacion-rutas', icon: 'truck' },
        { label: 'Despachos & Rutas', route: '/app/distribution', icon: 'truck' },
        { label: 'Incidencias', route: '/app/incidencias', icon: 'alert' },
        { label: 'Flota & Choferes', route: '/app/fleet', icon: 'truck' },
        { label: 'Mantenimiento', route: '/app/mantenimiento', icon: 'wrench' }
      ]
    },
    {
      id: 'admin',
      title: 'Administración & Analítica',
      collapsed: false,
      items: [
        { label: 'Usuarios & Roles', route: '/app/usuarios', icon: 'users' },
        { label: 'Reportes', route: '/app/reportes', icon: 'reports' }
      ]
    }
  ];

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  toggleSection(section: NavSection): void {
    section.collapsed = !section.collapsed;
  }
}
