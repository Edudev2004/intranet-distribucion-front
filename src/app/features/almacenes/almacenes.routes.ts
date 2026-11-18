import { Routes } from '@angular/router';

export const almacenesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/almacenes-page/almacenes.page').then(m => m.AlmacenesPageComponent),
  },
];