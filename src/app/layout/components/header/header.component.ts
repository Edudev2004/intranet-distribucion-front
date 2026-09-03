import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <div class="header-left">
        <span class="system-title">Intranet de Distribución y Logística</span>
      </div>
      <div class="header-right">
        <div class="user-info">
          <span class="user-name">{{ currentUser()?.fullName || 'Usuario Logística' }}</span>
          <span class="user-role">{{ currentUser()?.role || 'OPERADOR' }}</span>
        </div>
        <button (click)="logout()" class="btn-logout">Cerrar Sesión</button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      height: 64px;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
      margin-left: 260px;
    }
    .system-title {
      font-weight: 600;
      color: #475569;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      text-align: right;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }
    .user-role {
      font-size: 0.75rem;
      color: #64748b;
    }
    .btn-logout {
      background: none;
      border: 1px solid #cbd5e1;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      color: #475569;
      transition: all 0.2s;
    }
    .btn-logout:hover {
      background-color: #f1f5f9;
      color: #0f172a;
    }
  `]
})
export class HeaderComponent {
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
  }
}
