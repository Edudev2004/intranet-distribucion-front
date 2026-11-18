import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IconComponent],
  template: `
    <header class="topbar">
      <!-- Lado Izquierdo: Contexto del Sistema -->
      <div class="topbar-left">
        <div class="system-badge">
          <span class="live-dot"></span>
          <span class="system-title">EnRuta | Plataforma de Distribución</span>
        </div>
      </div>

      <!-- Lado Derecho: Usuario & Acciones -->
      <div class="topbar-right">
        <!-- Indicador de Notificaciones -->
        <button type="button" class="icon-action-btn" title="Notificaciones">
          <app-icon name="bell" [size]="18"></app-icon>
          <span class="notif-badge"></span>
        </button>

        <!-- Divider -->
        <div class="topbar-divider"></div>

        <!-- Perfil de Usuario -->
        <div class="user-profile">
          <div class="user-avatar">
            {{ userInitials() }}
          </div>
          <div class="user-meta">
            <span class="user-name">{{ currentUser()?.fullName || 'Usuario Operativo' }}</span>
            <div class="role-wrapper">
              <span class="role-pill">{{ currentUser()?.role || 'OPERADOR' }}</span>
            </div>
          </div>
        </div>

        <!-- Botón Salir -->
        <button type="button" (click)="logout()" class="btn-logout" title="Cerrar sesión">
          <app-icon name="logout" [size]="17"></app-icon>
          <span class="logout-text">Salir</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: 66px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      border-radius: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 22px;
      margin: 16px 24px 0 24px;
      position: sticky;
      top: 16px;
      z-index: 50;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .system-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #18d600;
      box-shadow: 0 0 8px #18d600;
    }

    .system-title {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      letter-spacing: -0.2px;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .icon-action-btn {
      position: relative;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #64748b;
      width: 36px;
      height: 36px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .icon-action-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }

    .notif-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: #ef4444;
      border: 2px solid #ffffff;
    }

    .topbar-divider {
      width: 1px;
      height: 28px;
      background-color: #e2e8f0;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 11px;
    }

    .user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #18d600 0%, #15803d 100%);
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 10px rgba(24, 214, 0, 0.25);
      flex-shrink: 0;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }

    .user-name {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }

    .role-wrapper {
      display: flex;
      align-items: center;
    }

    .role-pill {
      font-size: 10.5px;
      font-weight: 700;
      color: #166534;
      background: #dcfce7;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .btn-logout {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      color: #dc2626;
      border-radius: 9px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-logout:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #b91c1c;
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .topbar {
        margin: 10px 12px 0 12px;
        padding: 0 14px;
      }
      .system-title, .logout-text, .user-meta {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user?.fullName) return 'US';
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.fullName.substring(0, 2).toUpperCase();
  });

  logout(): void {
    this.authService.logout();
  }
}
