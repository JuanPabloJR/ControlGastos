// src/app/pages/tabs/tabs.routes.ts

import { Routes } from '@angular/router';
import { TabsPage } from './tabs.component';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('../home/home.page').then(m => m.HomePage)
      },
      {
        path: 'gastos',
        loadComponent: () => import('../gastos/gastos.page').then(m => m.GastosPage)
      },
      {
        path: 'ingresos',
        loadComponent: () => import('../ingresos/ingresos.page').then(m => m.IngresosPage)
      },
      {
        path: 'presupuestos',
        loadComponent: () => import('../presupuestos/presupuestos.page').then(m => m.PresupuestosPage)
      },
      {
        path: 'reportes',
        loadComponent: () => import('../reportes/reportes.page').then(m => m.ReportesPage)
      },
      {
        path: 'configuracion',
        loadComponent: () => import('../configuracion/configuracion.page').then(m => m.ConfiguracionPage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
];