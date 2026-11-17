import { Routes } from '@angular/router';

export const pedidosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/pedidos-page/pedidos.page').then(m => m.PedidosPageComponent),
  },
];