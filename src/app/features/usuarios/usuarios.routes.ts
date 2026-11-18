import { Routes } from '@angular/router';

export const usuariosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/usuarios-page/usuarios.page').then(m => m.UsuariosPageComponent),
  },
];
