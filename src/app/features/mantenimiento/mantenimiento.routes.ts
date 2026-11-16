import { Routes } from '@angular/router';

export const mantenimientoRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/mantenimiento-page/mantenimiento.page').then(m => m.MantenimientoPageComponent),
  },
];