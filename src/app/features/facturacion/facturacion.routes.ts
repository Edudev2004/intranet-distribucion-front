import { Routes } from '@angular/router';

export const facturacionRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/facturacion-page/facturacion.page').then(m => m.FacturacionPageComponent),
  },
];
