import { Routes } from '@angular/router';

export const zonasRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/zonas-page/zonas.page').then(m => m.ZonasPageComponent)
  }
];
