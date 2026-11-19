import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { LoginPageComponent } from './login.page';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe contener los 5 roles demo con contrasena password123', () => {
    expect(component.rolesDemo.length).toBe(5);
    const roles = component.rolesDemo.map(r => r.rol);
    expect(roles).toEqual(['ADMIN', 'SUPERVISOR', 'ALMACENERO', 'CONDUCTOR', 'CLIENTE']);

    for (const demo of component.rolesDemo) {
      expect(demo.password).toBe('password123');
      expect(demo.email).toContain('@distribucion.com');
      expect(demo.ruta).toBeTruthy();
    }
  });

  it('debe auto-completar credenciales en los inputs al seleccionar un rol demo', () => {
    const adminDemo = component.rolesDemo.find(r => r.rol === 'ADMIN')!;
    component.seleccionarDemo(adminDemo);

    expect(component.username).toBe('admin@distribucion.com');
    expect(component.password).toBe('password123');

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'admin@distribucion.com',
      password: 'password123',
    });

    req.flush({
      accessToken: 'test-token-admin',
      tokenType: 'Bearer',
      rol: 'ADMIN',
      correo: 'admin@distribucion.com',
      nombreCompleto: 'Administrador Demo',
    });
  });

  it('debe llamar authService.login y navegar a la ruta del rol al autenticarse exitosamente', () => {
    const loginSpy = vi.spyOn(authService, 'login');
    const almaceneroDemo = component.rolesDemo.find(r => r.rol === 'ALMACENERO')!;

    component.seleccionarDemo(almaceneroDemo);

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({
      accessToken: 'test-token-almacen',
      tokenType: 'Bearer',
      rol: 'ALMACENERO',
      correo: 'almacen@distribucion.com',
      nombreCompleto: 'Almacenero Demo',
    });

    expect(loginSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'almacen@distribucion.com',
        role: 'ALMACENERO',
        fullName: 'Almacenero Demo',
      }),
      'test-token-almacen',
      '/app/inventory'
    );
  });

  it('debe mostrar mensaje de error cuando falla la autenticacion', () => {
    component.username = 'invalido@distribucion.com';
    component.password = 'wrongpass';

    component.onLogin();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush(
      { message: 'Credenciales inválidas' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(component.cargando).toBe(false);
    expect(component.error).toBe('Credenciales inválidas');
  });

  it('debe alternar la visibilidad de la contrasena', () => {
    expect(component.showPassword).toBe(false);
    component.showPassword = !component.showPassword;
    expect(component.showPassword).toBe(true);
  });
});
