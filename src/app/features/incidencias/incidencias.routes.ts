import { Routes } from '@angular/router';

export const incidenciasRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/incidencias-page/incidencias.page').then(m => m.IncidenciasPageComponent),
  },
];
