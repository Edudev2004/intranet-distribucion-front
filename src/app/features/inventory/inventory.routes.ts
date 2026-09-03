import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/inventory-list/inventory-list.page').then(m => m.InventoryListPageComponent)
  }
];
