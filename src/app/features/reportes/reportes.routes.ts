import { Routes } from '@angular/router';

export const reportesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/reporte-inventario-page/reporte-inventario.page').then(m => m.ReporteInventarioPageComponent),
  },
];
