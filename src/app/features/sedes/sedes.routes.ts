import { Routes } from '@angular/router';

export const sedesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/sedes-page/sedes.page').then(m => m.SedesPageComponent),
  },
];
