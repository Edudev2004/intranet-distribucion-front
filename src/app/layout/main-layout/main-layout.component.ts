import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="layout-container">
      <!-- Barra lateral dinámica -->
      <app-sidebar [(collapsed)]="isSidebarCollapsed"></app-sidebar>

      <!-- Contenedor principal con Header flotante y vista activa -->
      <div class="layout-wrapper">
        <app-header></app-header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      min-height: 100vh;
      width: 100%;
      background-color: var(--bg-main, #f1f5f9);
      position: relative;
    }

    .layout-wrapper {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      padding: 24px;
      position: relative;
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 14px;
      }
    }
  `]
})
export class MainLayoutComponent {
  isSidebarCollapsed = false;
}
