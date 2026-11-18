import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="error-container">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>

      <div class="error-card">
        <div class="logo-wrap">
          <img src="enruta.webp" alt="EnRuta" class="enruta-logo" />
        </div>

        <div class="code-badge">
          <span class="code-number">404</span>
        </div>

        <h1 class="error-title">Página no encontrada</h1>
        <p class="error-desc">
          La ruta a la que intentas acceder no existe, fue trasladada o el enlace ingresado es incorrecto.
        </p>

        <div class="error-actions">
          <a routerLink="/app/dashboard" class="btn-primary">
            <app-icon name="dashboard" [size]="18"></app-icon>
            <span>Volver al Dashboard</span>
          </a>
          <a routerLink="/auth/login" class="btn-secondary">
            <span>Iniciar Sesión</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background-color: #0b1120;
      color: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .error-container {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      overflow: hidden;
    }

    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      pointer-events: none;
    }

    .glow-1 {
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(24, 214, 0, 0.18) 0%, transparent 70%);
      top: -100px;
      right: 10%;
    }

    .glow-2 {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%);
      bottom: -100px;
      left: 10%;
    }

    .error-card {
      position: relative;
      z-index: 2;
      max-width: 520px;
      width: 100%;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 3rem 2.5rem;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(24, 214, 0, 0.05);
    }

    .logo-wrap {
      margin-bottom: 2rem;
    }

    .enruta-logo {
      height: 44px;
      object-fit: contain;
    }

    .code-badge {
      display: inline-block;
      margin-bottom: 1.25rem;
    }

    .code-number {
      font-size: 80px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -3px;
      background: linear-gradient(135deg, #ffffff 40%, #18d600 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 10px 30px rgba(24, 214, 0, 0.2);
    }

    .error-title {
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 0.75rem;
      color: #ffffff;
      letter-spacing: -0.5px;
    }

    .error-desc {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 2rem;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0.75rem 1.5rem;
      background: #18d600;
      color: #052e16;
      font-weight: 700;
      font-size: 14px;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 4px 16px rgba(24, 214, 0, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(24, 214, 0, 0.45);
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      padding: 0.75rem 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      font-weight: 600;
      font-size: 14px;
      border-radius: 12px;
      text-decoration: none;
      transition: background 0.2s, color 0.2s;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
  `]
})
export class NotFoundPageComponent {}
