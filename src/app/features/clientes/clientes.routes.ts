import { Routes } from '@angular/router';

export const clientesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/clientes-page/clientes.page').then(m => m.ClientesPageComponent)
  }
];
