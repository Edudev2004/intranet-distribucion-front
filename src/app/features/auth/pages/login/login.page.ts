import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

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
      max-width: 440px;
    }

    .login-brand-header {
      margin-bottom: 24px;
    }

    .login-logo-img {
      max-height: 48px;
      max-width: 180px;
      object-fit: contain;
      display: block;
    }

    .login-title {
      color: #ffffff;
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .login-subtitle {
      color: #94a3b8;
      font-size: 15px;
      margin-bottom: 32px;
    }

    .login-subtitle strong {
      color: #18d600;
      font-weight: 600;
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
      margin-bottom: 24px;
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
      gap: 20px;
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
      padding: 14px 16px;
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
      padding: 15px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      margin-top: 10px;
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

    .version-tag {
      padding: 3px 10px;
      border-radius: 999px;
      background: rgba(24, 214, 0, 0.15);
      border: 1px solid rgba(24, 214, 0, 0.3);
      color: #18d600;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
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

  private authService = inject(AuthService);
  private http = inject(HttpClient);

  onLogin(): void {
    if (!this.username || !this.password) {
      return;
    }
    this.error = '';
    this.cargando = true;
    const body = { email: this.username.trim(), password: this.password };
    this.http.post<{ accessToken: string }>(`${environment.apiUrl}/auth/login`, body).subscribe({
      next: res => {
        this.cargando = false;
        this.authService.login({
          id: '0',
          username: body.email,
          email: body.email,
          fullName: body.email,
          role: 'ADMIN'
        }, res.accessToken);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.error = err.error?.message ?? 'Usuario o contraseña incorrectos';
      },
    });
  }
}
