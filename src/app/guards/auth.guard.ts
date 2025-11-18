// src/app/guards/auth.guard.ts

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const autenticado = await authService.estaAutenticado();
  
  if (!autenticado) {
    router.navigate(['/login']);
    return false;
  }
  
  return true;
};

export const loginGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const autenticado = await authService.estaAutenticado();
  
  if (autenticado) {
    router.navigate(['/tabs/home']);
    return false;
  }
  
  return true;
};