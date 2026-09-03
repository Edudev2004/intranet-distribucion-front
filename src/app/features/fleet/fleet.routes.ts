import { Routes } from '@angular/router';

export const fleetRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/fleet-list/fleet-list.page').then(m => m.FleetListPageComponent)
  }
];
