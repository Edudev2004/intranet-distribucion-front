import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">📦</span>
        <span class="brand-text">Distribución PRO</span>
      </div>
      <nav class="sidebar-nav">
        <a routerLink="/app/dashboard" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Dashboard</span>
        </a>
        <a routerLink="/app/usuarios" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🧑‍💼</span>
          <span class="nav-label">Usuarios</span>
        </a>
        <a routerLink="/app/distribution" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🚚</span>
          <span class="nav-label">Despachos & Rutas</span>
        </a>
        <a routerLink="/app/incidencias" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">⚠️</span>
          <span class="nav-label">Incidencias</span>
        </a>
        <a routerLink="/app/inventory" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🏬</span>
          <span class="nav-label">Inventario</span>
        </a>
        <a routerLink="/app/categorias" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🏷️</span>
          <span class="nav-label">Categorías</span>
        </a>
        <a routerLink="/app/fleet" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🚛</span>
          <span class="nav-label">Flota & Choferes</span>
        </a>
        <a routerLink="/app/almacenes" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🏭</span>
          <span class="nav-label">Almacenes</span>
        </a>
        <a routerLink="/app/mantenimiento" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🛠️</span>
          <span class="nav-label">Mantenimiento</span>
        </a>
        <a routerLink="/app/pedidos" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🧾</span>
          <span class="nav-label">Pedidos</span>
        </a>
        <a routerLink="/app/facturacion" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">💳</span>
          <span class="nav-label">Facturación</span>
        </a>
        <a routerLink="/app/reportes" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📑</span>
          <span class="nav-label">Reportes</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background-color: #1e293b;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
    }
    .sidebar-brand {
      padding: 1.5rem;
      font-size: 1.25rem;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid #334155;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      padding: 1rem 0;
      gap: 0.25rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: #94a3b8;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .nav-item:hover, .nav-item.active {
      color: #ffffff;
      background-color: #334155;
      border-left: 4px solid #3b82f6;
    }
  `]
})
export class SidebarComponent {}