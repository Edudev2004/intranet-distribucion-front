import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Palabras clave técnicas de bases de datos y excepciones internas
 * que NUNCA deben mostrarse al usuario final por seguridad.
 */
const TECHNICAL_LEAK_PATTERNS = [
  /\bselect\b.*\bfrom\b/i,
  /\binsert\b.*\binto\b/i,
  /\bupdate\b.*\bset\b/i,
  /\bdelete\b.*\bfrom\b/i,
  /\bjdbc\b/i,
  /\bsql\b/i,
  /\brelation\b.*does not exist/i,
  /\bhibernate\b/i,
  /\bpostgresql\b/i,
  /\bexception\b/i,
  /\bstacktrace\b/i,
  /\bcolumn\b.*does not exist/i,
  /\bforeign key\b/i,
  /\bnull pointer\b/i
];

function isTechnicalLeak(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  return TECHNICAL_LEAK_PATTERNS.some(pattern => pattern.test(message));
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 1. Registro seguro en consola únicamente para desarrollo
      console.error(`[HTTP Error ${error.status}] URL: ${req.url}`, error);

      let mensajeSeguro = 'Ha ocurrido un error al procesar su solicitud.';

      // 2. Manejo por código de estado HTTP
      if (error.status === 0) {
        mensajeSeguro = 'No se pudo conectar con el servidor. Verifique su conexión de red o si la API está disponible.';
      } else if (error.status === 401) {
        // Token inválido o expirado
        if (!req.url.includes('/auth/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          router.navigate(['/auth/login']);
        }
        mensajeSeguro = 'Sesión no autorizada o expirada. Por favor, inicie sesión nuevamente.';
      } else if (error.status === 403) {
        mensajeSeguro = 'No tiene permisos suficientes para realizar esta acción.';
      } else if (error.status === 404) {
        mensajeSeguro = 'El recurso solicitado no fue encontrado.';
      } else if (error.status >= 500) {
        mensajeSeguro = 'Error interno en el servidor. Por favor, intente más tarde.';
      } else {
        // Para errores 400 (Bad Request, validaciones de negocio):
        const rawMessage = error.error?.mensaje ?? error.error?.message ?? error.message;
        if (rawMessage && !isTechnicalLeak(rawMessage)) {
          mensajeSeguro = rawMessage;
        } else {
          mensajeSeguro = 'Datos de solicitud inválidos o no procesables.';
        }
      }

      // 3. Crear un error clonado con el mensaje sanitizado
      const sanitizedError = new HttpErrorResponse({
        error: {
          ...(typeof error.error === 'object' ? error.error : {}),
          mensaje: mensajeSeguro,
          message: mensajeSeguro,
          sanitized: true
        },
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url ?? req.url
      });

      return throwError(() => sanitizedError);
    })
  );
};
