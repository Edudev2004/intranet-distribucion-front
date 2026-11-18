import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes)
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./features/usuarios/usuarios.routes').then(m => m.usuariosRoutes)
      },
      {
        path: 'distribution',
        loadChildren: () => import('./features/distribution/distribution.routes').then(m => m.distributionRoutes)
      },
      {
        path: 'incidencias',
        loadChildren: () => import('./features/incidencias/incidencias.routes').then(m => m.incidenciasRoutes)
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.inventoryRoutes)
      },
      {
        path: 'categorias',
        loadChildren: () => import('./features/categorias/categorias.routes').then(m => m.categoriasRoutes)
      },
      {
        path: 'fleet',
        loadChildren: () => import('./features/fleet/fleet.routes').then(m => m.fleetRoutes)
      },
      {
        path: 'almacenes',
        loadChildren: () => import('./features/almacenes/almacenes.routes').then(m => m.almacenesRoutes)
      },
      {
        path: 'mantenimiento',
        loadChildren: () => import('./features/mantenimiento/mantenimiento.routes').then(m => m.mantenimientoRoutes)
      },
      {
        path: 'pedidos',
        loadChildren: () => import('./features/pedidos/pedidos.routes').then(m => m.pedidosRoutes)
      },
      {
        path: 'facturacion',
        loadChildren: () => import('./features/facturacion/facturacion.routes').then(m => m.facturacionRoutes)
      },
      {
        path: 'reportes',
        loadChildren: () => import('./features/reportes/reportes.routes').then(m => m.reportesRoutes)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];