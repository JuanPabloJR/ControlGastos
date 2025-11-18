// src/app/models/presupuesto.model.ts

export interface Presupuesto {
  id: string;
  categoria: string;
  montoAsignado: number;
  periodo: 'mensual' | 'semanal' | 'anual';
  mes?: number; // 0-11 (Enero = 0, Diciembre = 11)
  anio?: number;
  alertaActivada: boolean;
  porcentajeAlerta: number; // Ej: 80 para alertar al 80%
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumenPresupuesto {
  presupuesto: Presupuesto;
  gastado: number;
  disponible: number;
  porcentajeUsado: number;
  excedido: boolean;
}