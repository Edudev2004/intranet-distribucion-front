import { Routes } from '@angular/router';

export const distributionRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/distribution-list/distribution-list.page').then(m => m.DistributionListPage)
  }
];