import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { errorInterceptor } from './error.interceptor';

describe('ErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should sanitize technical SQL leaks in 500 responses', () => {
    let capturedError: any = null;

    http.get('/api/test-leak').subscribe({
      error: (err) => {
        capturedError = err;
      }
    });

    const req = httpMock.expectOne('/api/test-leak');
    req.flush(
      { message: 'JDBC exception executing SQL [ERROR: relation "cliente" does not exist] [SELECT * FROM cliente]' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    expect(capturedError).not.toBeNull();
    expect(capturedError.error.message).toBe('Error interno en el servidor. Por favor, intente más tarde.');
    expect(capturedError.error.mensaje).toBe('Error interno en el servidor. Por favor, intente más tarde.');
    // Garantiza que no se expone ninguna palabra reservada de BD
    expect(capturedError.error.mensaje).not.toContain('SELECT');
    expect(capturedError.error.mensaje).not.toContain('relation');
    expect(capturedError.error.mensaje).not.toContain('cliente');
  });

  it('should redirect to login on 401 Unauthorized', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    let capturedError: any = null;

    http.get('/api/protected-resource').subscribe({
      error: (err) => {
        capturedError = err;
      }
    });

    const req = httpMock.expectOne('/api/protected-resource');
    req.flush({ message: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });

    expect(capturedError).not.toBeNull();
    expect(capturedError.status).toBe(401);
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });
});
