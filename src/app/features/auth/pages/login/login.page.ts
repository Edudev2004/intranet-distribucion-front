import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-header">
      <h2>Intranet de Distribución</h2>
      <p>Ingresa tus credenciales de acceso</p>
    </div>

    <form (ngSubmit)="onLogin()" class="login-form">
      <div class="form-group">
        <label for="username">Usuario / Código</label>
        <input 
          type="text" 
          id="username" 
          [(ngModel)]="username" 
          name="username" 
          required 
          placeholder="Ej. DISP-01" 
        />
      </div>

      <div class="form-group">
        <label for="password">Contraseña</label>
        <input 
          type="password" 
          id="password" 
          [(ngModel)]="password" 
          name="password" 
          required 
          placeholder="••••••••" 
        />
      </div>

      <button type="submit" class="btn-primary">Iniciar Sesión</button>
    </form>
  `,
  styles: [`
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .login-header h2 {
      font-size: 1.5rem;
      color: #0f172a;
      margin-bottom: 0.5rem;
    }
    .login-header p {
      color: #64748b;
      font-size: 0.875rem;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .form-group label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #334155;
    }
    .form-group input {
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.95rem;
    }
    .btn-primary {
      padding: 0.75rem;
      background-color: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: background 0.2s;
    }
    .btn-primary:hover {
      background-color: #1d4ed8;
    }
  `]
})
export class LoginPageComponent {
  username = '';
  password = '';

  private authService = inject(AuthService);

  onLogin(): void {
    if (this.username && this.password) {
      this.authService.login({
        id: '1',
        username: this.username,
        email: `${this.username.toLowerCase()}@distribucion.com`,
        fullName: 'Operador de Despacho',
        role: 'DISPATCHER'
      }, 'mock-jwt-token-xyz');
    }
  }
}
