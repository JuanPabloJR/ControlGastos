// src/app/services/presupuestos.service.ts

import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { GastosService } from './gastos';
import { Presupuesto, ResumenPresupuesto } from '../models/presupuesto';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PresupuestosService {
  private readonly PRESUPUESTOS_KEY = 'presupuestos_';
  
  private presupuestosSubject = new BehaviorSubject<Presupuesto[]>([]);
  public presupuestos$: Observable<Presupuesto[]> = this.presupuestosSubject.asObservable();

  constructor(
    private storage: StorageService,
    private gastosService: GastosService
  ) {
    this.loadPresupuestos();
  }

  // ========== INICIALIZACIÓN ==========
  private async loadPresupuestos(): Promise<void> {
    const presupuestos = await this.storage.getAllByPrefix(this.PRESUPUESTOS_KEY);
    this.presupuestosSubject.next(presupuestos);
  }

  // ========== CRUD PRESUPUESTOS ==========
  async crearPresupuesto(presupuesto: Omit<Presupuesto, 'id' | 'createdAt' | 'updatedAt'>): Promise<Presupuesto> {
    const nuevoPresupuesto: Presupuesto = {
      ...presupuesto,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.set(this.PRESUPUESTOS_KEY + nuevoPresupuesto.id, nuevoPresupuesto);
    await this.loadPresupuestos();
    return nuevoPresupuesto;
  }

  async obtenerPresupuesto(id: string): Promise<Presupuesto | null> {
    return await this.storage.get(this.PRESUPUESTOS_KEY + id);
  }

  async obtenerTodosPresupuestos(): Promise<Presupuesto[]> {
    return await this.storage.getAllByPrefix(this.PRESUPUESTOS_KEY);
  }

  async actualizarPresupuesto(id: string, presupuesto: Partial<Presupuesto>): Promise<Presupuesto | null> {
    const presupuestoExistente = await this.obtenerPresupuesto(id);
    if (!presupuestoExistente) return null;

    const presupuestoActualizado: Presupuesto = {
      ...presupuestoExistente,
      ...presupuesto,
      id: presupuestoExistente.id,
      updatedAt: new Date()
    };

    await this.storage.set(this.PRESUPUESTOS_KEY + id, presupuestoActualizado);
    await this.loadPresupuestos();
    return presupuestoActualizado;
  }

  async eliminarPresupuesto(id: string): Promise<boolean> {
    await this.storage.remove(this.PRESUPUESTOS_KEY + id);
    await this.loadPresupuestos();
    return true;
  }

  // ========== BÚSQUEDAS ESPECÍFICAS ==========
  async obtenerPresupuestosPorPeriodo(periodo: 'mensual' | 'semanal' | 'anual'): Promise<Presupuesto[]> {
    const presupuestos = await this.obtenerTodosPresupuestos();
    return presupuestos.filter(p => p.periodo === periodo);
  }

  async obtenerPresupuestoMensualPorCategoria(categoria: string, mes: number, anio: number): Promise<Presupuesto | null> {
    const presupuestos = await this.obtenerTodosPresupuestos();
    return presupuestos.find(p => 
      p.categoria === categoria && 
      p.periodo === 'mensual' && 
      p.mes === mes && 
      p.anio === anio
    ) || null;
  }

  // ========== CÁLCULOS Y RESÚMENES ==========
  async calcularResumenPresupuesto(presupuestoId: string): Promise<ResumenPresupuesto | null> {
    const presupuesto = await this.obtenerPresupuesto(presupuestoId);
    if (!presupuesto) return null;

    let gastado = 0;

    if (presupuesto.periodo === 'mensual' && presupuesto.mes !== undefined && presupuesto.anio !== undefined) {
      const gastos = await this.gastosService.obtenerGastosMes(presupuesto.mes, presupuesto.anio);
      const gastosPorCategoria = gastos.filter(g => g.categoria === presupuesto.categoria);
      gastado = gastosPorCategoria.reduce((total, g) => total + g.monto, 0);
    } else if (presupuesto.periodo === 'anual' && presupuesto.anio !== undefined) {
      const gastos = await this.gastosService.obtenerGastosAnio(presupuesto.anio);
      const gastosPorCategoria = gastos.filter(g => g.categoria === presupuesto.categoria);
      gastado = gastosPorCategoria.reduce((total, g) => total + g.monto, 0);
    }

    const disponible = presupuesto.montoAsignado - gastado;
    const porcentajeUsado = (gastado / presupuesto.montoAsignado) * 100;
    const excedido = gastado > presupuesto.montoAsignado;

    return {
      presupuesto,
      gastado,
      disponible,
      porcentajeUsado,
      excedido
    };
  }

  async calcularResumenTodosPresupuestos(): Promise<ResumenPresupuesto[]> {
    const presupuestos = await this.obtenerTodosPresupuestos();
    const resumenes: ResumenPresupuesto[] = [];

    for (const presupuesto of presupuestos) {
      const resumen = await this.calcularResumenPresupuesto(presupuesto.id);
      if (resumen) {
        resumenes.push(resumen);
      }
    }

    return resumenes;
  }

  async obtenerPresupuestosExcedidos(): Promise<ResumenPresupuesto[]> {
    const resumenes = await this.calcularResumenTodosPresupuestos();
    return resumenes.filter(r => r.excedido);
  }

  async obtenerPresupuestosProximosAlLimite(porcentaje: number = 80): Promise<ResumenPresupuesto[]> {
    const resumenes = await this.calcularResumenTodosPresupuestos();
    return resumenes.filter(r => r.porcentajeUsado >= porcentaje && !r.excedido);
  }

  // ========== ALERTAS Y NOTIFICACIONES ==========
  async verificarAlertas(): Promise<{ tipo: 'excedido' | 'alerta', resumen: ResumenPresupuesto }[]> {
    const resumenes = await this.calcularResumenTodosPresupuestos();
    const alertas: { tipo: 'excedido' | 'alerta', resumen: ResumenPresupuesto }[] = [];

    for (const resumen of resumenes) {
      if (!resumen.presupuesto.alertaActivada) continue;

      if (resumen.excedido) {
        alertas.push({ tipo: 'excedido', resumen });
      } else if (resumen.porcentajeUsado >= resumen.presupuesto.porcentajeAlerta) {
        alertas.push({ tipo: 'alerta', resumen });
      }
    }

    return alertas;
  }

  // ========== ESTADÍSTICAS ==========
  async obtenerEstadisticasPresupuestos(): Promise<{
    totalPresupuestado: number;
    totalGastado: number;
    totalDisponible: number;
    porcentajeGlobalUsado: number;
  }> {
    const resumenes = await this.calcularResumenTodosPresupuestos();
    
    const totalPresupuestado = resumenes.reduce((sum, r) => sum + r.presupuesto.montoAsignado, 0);
    const totalGastado = resumenes.reduce((sum, r) => sum + r.gastado, 0);
    const totalDisponible = resumenes.reduce((sum, r) => sum + r.disponible, 0);
    const porcentajeGlobalUsado = totalPresupuestado > 0 ? (totalGastado / totalPresupuestado) * 100 : 0;

    return {
      totalPresupuestado,
      totalGastado,
      totalDisponible,
      porcentajeGlobalUsado
    };
  }

  // ========== UTILIDADES ==========
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async limpiarTodosPresupuestos(): Promise<void> {
    await this.storage.removeByPrefix(this.PRESUPUESTOS_KEY);
    await this.loadPresupuestos();
  }

  // ========== HELPERS PARA FECHAS ==========
  obtenerMesActual(): number {
    return new Date().getMonth();
  }

  obtenerAnioActual(): number {
    return new Date().getFullYear();
  }
}