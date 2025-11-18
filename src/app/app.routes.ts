// src/app/app.routes.ts

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.routes').then(m => m.routes)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'gastos',
    loadComponent: () => import('./pages/gastos/gastos.page').then( m => m.GastosPage)
  },
  {
    path: 'ingresos',
    loadComponent: () => import('./pages/ingresos/ingresos.page').then( m => m.IngresosPage)
  },
  {
    path: 'presupuestos',
    loadComponent: () => import('./pages/presupuestos/presupuestos.page').then( m => m.PresupuestosPage)
  },
  {
    path: 'reportes',
        loadComponent: () => import('./pages/reportes/reportes.page').then(m => m.ReportesPage)
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./pages/configuracion/configuracion.page').then( m => m.ConfiguracionPage)
  },
];