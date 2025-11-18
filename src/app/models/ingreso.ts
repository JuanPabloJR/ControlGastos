// src/app/models/ingreso.model.ts

export interface Ingreso {
  id: string;
  monto: number;
  fuente: string;
  fecha: Date;
  descripcion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FuenteIngreso {
  id: string;
  nombre: string;
  icono: string;
  color: string;
}

export const FUENTES_INGRESO_DEFAULT: FuenteIngreso[] = [
  { id: '1', nombre: 'Salario', icono: 'cash', color: '#2ECC71' },
  { id: '2', nombre: 'Freelance', icono: 'laptop', color: '#3498DB' },
  { id: '3', nombre: 'Negocio', icono: 'business', color: '#9B59B6' },
  { id: '4', nombre: 'Inversiones', icono: 'trending-up', color: '#1ABC9C' },
  { id: '5', nombre: 'Bonos', icono: 'gift', color: '#F39C12' },
  { id: '6', nombre: 'Ventas', icono: 'cart', color: '#E74C3C' },
  { id: '7', nombre: 'Otros', icono: 'add-circle', color: '#95A5A6' }
];
