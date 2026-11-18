import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
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
            <span class="nav-section-title">OPERACIONES & GESTIÓN</span>
          }

          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-item"
              [attr.title]="collapsed ? item.label : null"
            >
              <div class="item-icon">
                <app-icon [name]="item.icon" [size]="19"></app-icon>
              </div>
              @if (!collapsed) {
                <span class="nav-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="nav-badge">{{ item.badge }}</span>
                }
              }
            </a>
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

    .brand-info {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }

    .brand-title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: #ffffff;
    }

    .brand-sub {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #18d600;
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
      padding: 18px 0;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 12px;
    }

    .nav-section-title {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.08em;
      padding: 10px 14px 6px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      border-radius: 9px;
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
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(24, 214, 0, 0.15);
      color: #18d600;
      font-size: 11px;
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
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(24, 214, 0, 0.35);
      transform: none;
    }

    .nav-item.active .item-icon {
      color: #052e16;
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 12px 0;
      border-radius: 10px;
    }

    .sidebar.collapsed .nav-item:hover {
      transform: none;
    }

    /* ── FOOTER ── */
    .sidebar-footer {
      padding: 16px 18px;
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
      padding: 16px 0;
    }

    .sidebar.collapsed .status-indicator {
      justify-content: center;
    }
  `]
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/app/dashboard', icon: 'dashboard' },
    { label: 'Usuarios', route: '/app/usuarios', icon: 'users' },
    { label: 'Almacenes', route: '/app/almacenes', icon: 'warehouse' },
    { label: 'Categorías', route: '/app/categorias', icon: 'tag' },
    { label: 'Pedidos', route: '/app/pedidos', icon: 'orders' },
    { label: 'Facturación', route: '/app/facturacion', icon: 'invoice' },
    { label: 'Despachos & Rutas', route: '/app/distribution', icon: 'truck' },
    { label: 'Incidencias', route: '/app/incidencias', icon: 'alert' },
    { label: 'Inventario', route: '/app/inventory', icon: 'inventory' },
    { label: 'Flota & Choferes', route: '/app/fleet', icon: 'truck' },
    { label: 'Mantenimiento', route: '/app/mantenimiento', icon: 'wrench' },
    { label: 'Reportes', route: '/app/reportes', icon: 'reports' }
  ];

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }
}
