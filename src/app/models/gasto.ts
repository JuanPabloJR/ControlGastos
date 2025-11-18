// src/app/models/gasto.model.ts

export interface Gasto {
  id: string;
  monto: number;
  categoria: string;
  fecha: Date;
  descripcion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoriaGasto {
  id: string;
  nombre: string;
  icono: string;
  color: string;
}

export const CATEGORIAS_GASTO_DEFAULT: CategoriaGasto[] = [
  { id: '1', nombre: 'Alimentación', icono: 'fast-food', color: '#FF6B6B' },
  { id: '2', nombre: 'Transporte', icono: 'car', color: '#4ECDC4' },
  { id: '3', nombre: 'Entretenimiento', icono: 'game-controller', color: '#45B7D1' },
  { id: '4', nombre: 'Servicios', icono: 'receipt', color: '#FFA07A' },
  { id: '5', nombre: 'Salud', icono: 'medkit', color: '#98D8C8' },
  { id: '6', nombre: 'Educación', icono: 'school', color: '#A8E6CF' },
  { id: '7', nombre: 'Ropa', icono: 'shirt', color: '#FFD3B6' },
  { id: '8', nombre: 'Hogar', icono: 'home', color: '#FFAAA5' },
  { id: '9', nombre: 'Otros', icono: 'ellipsis-horizontal', color: '#95A5A6' }
];
