// src/app/models/usuario.model.ts

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password: string;
  moneda: string;
  idioma: string;
  notificacionesActivas: boolean;
  biometriaActiva: boolean;
  createdAt: Date;
}

export interface ConfiguracionUsuario {
  moneda: string;
  simboloMoneda: string;
  idioma: string;
  formatoFecha: string;
  notificaciones: {
    presupuestos: boolean;
    recordatorios: boolean;
    resumenDiario: boolean;
  };
  tema: 'light' | 'dark' | 'auto';
}

export const CONFIGURACION_DEFAULT: ConfiguracionUsuario = {
  moneda: 'MXN',
  simboloMoneda: '$',
  idioma: 'es',
  formatoFecha: 'DD/MM/YYYY',
  notificaciones: {
    presupuestos: true,
    recordatorios: true,
    resumenDiario: false
  },
  tema: 'auto'
};
