import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

export interface DemoRole {
  nombre: string;
  rol: string;
  email: string;
  password: string;
  ruta: string;
  rutaCorta: string;
  icono: string;
  color: string;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="login-wrapper">
      <!-- Panel Izquierdo: Formulario -->
      <div class="login-form-panel">
        <div class="form-container">
          <div class="login-brand-header">
            <img src="enruta.webp" alt="EnRuta" class="login-logo-img" />
          </div>

          <h2 class="login-title">Inicia sesión</h2>
          <p class="login-subtitle">
            Bienvenido a la plataforma de gestión <strong>EnRuta</strong>.
          </p>

          <!-- ACCESOS DE PRUEBA RÁPIDA (1-CLICK) -->
          <div class="demo-access-container">
            <div class="demo-access-header">
              <span class="zap-icon">
                <app-icon name="zap" [size]="14"></app-icon>
              </span>
              <span>ACCESOS DE PRUEBA RÁPIDA (1-CLICK):</span>
            </div>

            <div class="demo-cards-grid">
              @for (demo of rolesDemo; track demo.rol) {
                <button
                  type="button"
                  class="demo-card"
                  [class.active]="username === demo.email"
                  (click)="seleccionarDemo(demo)"
                  [attr.aria-label]="'Ingresar como ' + demo.nombre"
                >
                  <div class="demo-card-head">
                    <span class="demo-icon" [style.color]="demo.color">
                      <app-icon [name]="demo.icono" [size]="15"></app-icon>
                    </span>
                    <span class="demo-title" [style.color]="demo.color">{{ demo.nombre }}</span>
                  </div>
                  <span class="demo-route">{{ demo.rutaCorta }}</span>
                </button>
              }
            </div>
          </div>

          <!-- ALERTA DE ERROR -->
          @if (error) {
            <div class="error-alert">
              <div class="alert-icon">
                <app-icon name="alert" [size]="20"></app-icon>
              </div>
              <div class="alert-content">
                <p class="alert-heading">Error de autenticación</p>
                <p class="alert-message">{{ error }}</p>
              </div>
            </div>
          }

          <form (ngSubmit)="onLogin()" class="login-form">
            <div class="form-group">
              <label for="username">Usuario o Correo</label>
              <div class="input-wrapper">
                <input
                  type="text"
                  id="username"
                  [(ngModel)]="username"
                  name="username"
                  required
                  placeholder="ejemplo@correo.com o DISP-01"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="password">Contraseña</label>
              <div class="input-wrapper password-input-wrapper">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  id="password"
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  class="eye-btn"
                  (click)="showPassword = !showPassword"
                  [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
                >
                  <app-icon [name]="showPassword ? 'eye-off' : 'eye'" [size]="19"></app-icon>
                </button>
              </div>
            </div>

            <div class="options-row">
              <label class="remember-me">
                <input type="checkbox" [(ngModel)]="remember" name="remember" />
                <span>Recuérdame</span>
              </label>
              <a href="javascript:void(0)" class="forgot-pwd">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" class="submit-btn" [disabled]="cargando">
              @if (cargando) {
                <span class="spinner spinner-sm"></span>
                <span>Validando credenciales...</span>
              } @else {
                <span>Ingresar a la Intranet</span>
                <app-icon name="chevron-right" [size]="18"></app-icon>
              }
            </button>
          </form>
        </div>
      </div>

      <!-- Panel Derecho: Visual Branding Promolider Style -->
      <div class="login-brand-panel">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>

        <div class="brand-content">
          <div class="brand-logo-showcase">
            <img src="enruta.webp" alt="EnRuta" class="brand-large-logo" />
          </div>

          <h1 class="brand-title">
            Ecosistema integral<br />
            para tu distribución.
          </h1>

          <p class="brand-desc">
            Administra rutas en tiempo real, almacenes, inventario, flota vehicular y facturación electrónica desde un solo lugar.
          </p>

          <!-- Glassmorphism Card -->
          <div class="glass-card">
            <div class="glass-icon">
              <app-icon name="shield" [size]="24"></app-icon>
            </div>
            <div class="glass-info">
              <h4>Acceso Seguro & Centralizado</h4>
              <p>Conexión encriptada con API Spring Boot</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      flex: 1;
    }

    .login-wrapper {
      display: flex;
      min-height: 100vh;
      width: 100%;
      background-color: #0b1120;
    }

    /* ── PANEL IZQUIERDO (FORMULARIO) ── */
    .login-form-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0f172a;
      padding: 40px;
      position: relative;
      z-index: 2;
    }

    .form-container {
      width: 100%;
      max-width: 480px;
    }

    .login-brand-header {
      margin-bottom: 20px;
    }

    .login-logo-img {
      max-height: 48px;
      max-width: 180px;
      object-fit: contain;
      display: block;
    }

    .login-title {
      color: #ffffff;
      font-size: 30px;
      font-weight: 800;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }

    .login-subtitle {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 22px;
    }

    .login-subtitle strong {
      color: #18d600;
      font-weight: 600;
    }

    /* ── ACCESOS DE PRUEBA RÁPIDA ── */
    .demo-access-container {
      margin-bottom: 22px;
      padding: 14px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
    }

    .demo-access-header {
      display: flex;
      align-items: center;
      gap: 7px;
      color: #f59e0b;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
      user-select: none;
    }

    .demo-access-header .zap-icon {
      display: flex;
      align-items: center;
      color: #f59e0b;
    }

    .demo-cards-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .demo-card {
      flex: 1 1 calc(33.333% - 8px);
      min-width: 110px;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 9px 12px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 3px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }

    .demo-card:hover {
      background: #24344d;
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .demo-card.active {
      border-color: #18d600;
      background: rgba(24, 214, 0, 0.08);
      box-shadow: 0 0 0 1px #18d600, 0 4px 12px rgba(24, 214, 0, 0.15);
    }

    .demo-card-head {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
    }

    .demo-icon {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .demo-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.2px;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .demo-route {
      color: #94a3b8;
      font-size: 11px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      padding-left: 21px;
      line-height: 1;
    }

    /* ALERTA DE ERROR */
    .error-alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background-color: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-left: 4px solid #ef4444;
      border-radius: 10px;
      margin-bottom: 22px;
    }

    .alert-icon {
      color: #ef4444;
      margin-top: 1px;
    }

    .alert-heading {
      color: #f87171;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .alert-message {
      color: #fca5a5;
      font-size: 13px;
      line-height: 1.4;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      color: #cbd5e1;
      font-size: 14px;
      font-weight: 600;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-wrapper input,
    .input-wrapper input[type="text"],
    .input-wrapper input[type="password"] {
      width: 100%;
      padding: 13px 16px;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 10px;
      background-color: #0b1120 !important;
      color: #ffffff !important;
      font-size: 15px;
      outline: none;
      transition: all 0.2s ease;
    }

    .input-wrapper input:focus,
    .input-wrapper input[type="text"]:focus,
    .input-wrapper input[type="password"]:focus {
      border-color: #18d600 !important;
      background-color: #0f172a !important;
      box-shadow: 0 0 0 4px rgba(24, 214, 0, 0.18) !important;
    }

    .input-wrapper input::placeholder {
      color: #475569;
    }

    .input-wrapper input:-webkit-autofill,
    .input-wrapper input:-webkit-autofill:hover, 
    .input-wrapper input:-webkit-autofill:focus {
      -webkit-text-fill-color: #ffffff !important;
      -webkit-box-shadow: 0 0 0px 1000px #0b1120 inset !important;
      transition: background-color 5000s ease-in-out 0s;
    }

    .password-input-wrapper input {
      padding-right: 48px;
    }

    .eye-btn {
      position: absolute;
      right: 14px;
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }

    .eye-btn:hover {
      color: #18d600;
    }

    .options-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #94a3b8;
      font-size: 14px;
      cursor: pointer;
      user-select: none;
    }

    .remember-me input {
      accent-color: #18d600;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .forgot-pwd {
      color: #18d600;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: opacity 0.2s;
    }

    .forgot-pwd:hover {
      opacity: 0.8;
    }

    .submit-btn {
      background-color: #18d600;
      color: #052e16;
      border: none;
      border-radius: 10px;
      padding: 14px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 16px rgba(24, 214, 0, 0.35);
    }

    .submit-btn:hover:not(:disabled) {
      background-color: #119e00;
      color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 6px 22px rgba(24, 214, 0, 0.45);
    }

    .submit-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    /* ── PANEL DERECHO (BRANDING VISUAL) ── */
    .login-brand-panel {
      flex: 1.2;
      background: #0b1120;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 50px;
    }

    .brand-content {
      position: relative;
      z-index: 10;
      max-width: 520px;
      color: #ffffff;
    }

    .brand-logo-showcase {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 32px;
    }

    .brand-large-logo {
      max-height: 58px;
      max-width: 210px;
      object-fit: contain;
      display: block;
      filter: drop-shadow(0 4px 12px rgba(24, 214, 0, 0.25));
    }

    .brand-title {
      font-size: 46px;
      font-weight: 900;
      line-height: 1.15;
      margin-bottom: 20px;
      letter-spacing: -1px;
    }

    .brand-desc {
      font-size: 17px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 40px;
    }

    /* Glassmorphism Card */
    .glass-card {
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 22px 26px;
      display: flex;
      align-items: center;
      gap: 18px;
      max-width: 380px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }

    .glass-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background: rgba(24, 214, 0, 0.18);
      color: #18d600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .glass-info h4 {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }

    .glass-info p {
      font-size: 13px;
      color: #94a3b8;
    }

    /* Abstract Background Circles */
    .circle {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      z-index: 1;
      pointer-events: none;
    }

    .circle-1 {
      width: 500px;
      height: 500px;
      background: rgba(24, 214, 0, 0.16);
      top: -100px;
      right: -100px;
    }

    .circle-2 {
      width: 420px;
      height: 420px;
      background: rgba(59, 130, 246, 0.15);
      bottom: -60px;
      left: -100px;
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 900px) {
      .login-brand-panel {
        display: none;
      }
      .login-form-panel {
        padding: 24px;
      }
    }
  `]
})
export class LoginPageComponent {
  username = '';
  password = '';
  error = '';
  cargando = false;
  showPassword = false;
  remember = false;

  readonly rolesDemo: DemoRole[] = [
    {
      nombre: 'Admin',
      rol: 'ADMIN',
      email: 'admin@distribucion.com',
      password: 'password123',
      ruta: '/app/dashboard',
      rutaCorta: '/dashboard',
      icono: 'shield',
      color: '#f59e0b',
    },
    {
      nombre: 'Supervisor',
      rol: 'SUPERVISOR',
      email: 'supervisor@distribucion.com',
      password: 'password123',
      ruta: '/app/pedidos',
      rutaCorta: '/pedidos',
      icono: 'check-circle',
      color: '#06b6d4',
    },
    {
      nombre: 'Almacenero',
      rol: 'ALMACENERO',
      email: 'almacen@distribucion.com',
      password: 'password123',
      ruta: '/app/inventory',
      rutaCorta: '/inventory',
      icono: 'package',
      color: '#10b981',
    },
    {
      nombre: 'Conductor',
      rol: 'CONDUCTOR',
      email: 'conductor@distribucion.com',
      password: 'password123',
      ruta: '/app/distribution',
      rutaCorta: '/distribution',
      icono: 'truck',
      color: '#818cf8',
    },
    {
      nombre: 'Cliente',
      rol: 'CLIENTE',
      email: 'cliente@distribucion.com',
      password: 'password123',
      ruta: '/app/pedidos',
      rutaCorta: '/pedidos',
      icono: 'user',
      color: '#f43f5e',
    },
  ];

  private authService = inject(AuthService);
  private http = inject(HttpClient);

  seleccionarDemo(demo: DemoRole): void {
    this.username = demo.email;
    this.password = demo.password;
    this.error = '';
    this.onLogin(demo.ruta);
  }

  onLogin(targetRoute?: string): void {
    if (!this.username || !this.password) {
      return;
    }
    this.error = '';
    this.cargando = true;
    const body = { email: this.username.trim(), password: this.password };
    this.http.post<{ accessToken: string; rol?: string; correo?: string; nombreCompleto?: string }>(
      `${environment.apiUrl}/auth/login`,
      body
    ).subscribe({
      next: res => {
        this.cargando = false;
        const role = res.rol || 'ADMIN';
        const defaultRouteByRole: Record<string, string> = {
          ADMIN: '/app/dashboard',
          SUPERVISOR: '/app/pedidos',
          ALMACENERO: '/app/inventory',
          CONDUCTOR: '/app/distribution',
          CLIENTE: '/app/pedidos',
        };
        const redirect = targetRoute || defaultRouteByRole[role] || '/app/dashboard';
        this.authService.login({
          id: '0',
          username: body.email,
          email: res.correo || body.email,
          fullName: res.nombreCompleto || body.email,
          role: role,
        }, res.accessToken, redirect);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.error = err.error?.message ?? 'Usuario o contraseña incorrectos';
      },
    });
  }
}
