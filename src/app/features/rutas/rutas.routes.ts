import { Routes } from '@angular/router';

export const rutasRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/rutas-page/rutas.page').then(m => m.RutasPageComponent)
  }
];
