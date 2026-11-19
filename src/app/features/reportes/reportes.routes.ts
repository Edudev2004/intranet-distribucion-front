import { Routes } from '@angular/router';

export const reportesRoutes: Routes = [
  {
    path: '',
    redirectTo: 'inventario',
    pathMatch: 'full',
  },
  {
    path: 'inventario',
    loadComponent: () =>
      import('./pages/reporte-inventario-page/reporte-inventario.page').then(m => m.ReporteInventarioPageComponent),
  },
  {
    path: 'pedidos',
    loadComponent: () =>
      import('./pages/reporte-pedidos-page/reporte-pedidos.page').then(m => m.ReportePedidosPageComponent),
  },
  {
    path: 'entregas',
    loadComponent: () =>
      import('./pages/reporte-entregas-page/reporte-entregas.page').then(m => m.ReporteEntregasPageComponent),
  },
  {
    path: 'flota',
    loadComponent: () =>
      import('./pages/reporte-flota-page/reporte-flota.page').then(m => m.ReporteFlotaPageComponent),
  },
  {
    path: 'productividad',
    redirectTo: 'flota',
    pathMatch: 'full',
  },
];
