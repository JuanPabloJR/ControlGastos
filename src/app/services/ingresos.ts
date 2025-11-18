// src/app/services/ingresos.service.ts

import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Ingreso, FuenteIngreso, FUENTES_INGRESO_DEFAULT } from '../models/ingreso';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IngresosService {
  private readonly INGRESOS_KEY = 'ingresos_';
  private readonly FUENTES_KEY = 'fuentes_ingreso';

  private ingresosSubject = new BehaviorSubject<Ingreso[]>([]);
  public ingresos$: Observable<Ingreso[]> = this.ingresosSubject.asObservable();

  private fuentesSubject = new BehaviorSubject<FuenteIngreso[]>([]);
  public fuentes$: Observable<FuenteIngreso[]> = this.fuentesSubject.asObservable();

  constructor(private storage: StorageService) {
    this.initFuentes();
    this.loadIngresos();
  }

  // ========== INICIALIZACIÓN ==========
  private async initFuentes(): Promise<void> {
    let fuentes = await this.storage.get(this.FUENTES_KEY);
    if (!fuentes || fuentes.length === 0) {
      fuentes = FUENTES_INGRESO_DEFAULT;
      await this.storage.set(this.FUENTES_KEY, fuentes);
    }
    this.fuentesSubject.next(fuentes);
  }

  private async loadIngresos(): Promise<void> {
    const ingresos = await this.storage.getAllByPrefix(this.INGRESOS_KEY);
    this.ingresosSubject.next(ingresos);
  }

  // ========== CRUD INGRESOS ==========
  async agregarIngreso(ingreso: Omit<Ingreso, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ingreso> {
    const nuevoIngreso: Ingreso = {
      ...ingreso,
      id: this.generateId(),
      fecha: new Date(ingreso.fecha),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.set(this.INGRESOS_KEY + nuevoIngreso.id, nuevoIngreso);
    await this.loadIngresos();
    return nuevoIngreso;
  }

  async obtenerIngreso(id: string): Promise<Ingreso | null> {
    return await this.storage.get(this.INGRESOS_KEY + id);
  }

  async obtenerTodosIngresos(): Promise<Ingreso[]> {
    return await this.storage.getAllByPrefix(this.INGRESOS_KEY);
  }

  async actualizarIngreso(id: string, ingreso: Partial<Ingreso>): Promise<Ingreso | null> {
    const ingresoExistente = await this.obtenerIngreso(id);
    if (!ingresoExistente) return null;

    const ingresoActualizado: Ingreso = {
      ...ingresoExistente,
      ...ingreso,
      id: ingresoExistente.id,
      updatedAt: new Date()
    };

    await this.storage.set(this.INGRESOS_KEY + id, ingresoActualizado);
    await this.loadIngresos();
    return ingresoActualizado;
  }

  async eliminarIngreso(id: string): Promise<boolean> {
    await this.storage.remove(this.INGRESOS_KEY + id);
    await this.loadIngresos();
    return true;
  }

  // ========== FILTROS Y BÚSQUEDAS ==========
  async obtenerIngresosPorFuente(fuente: string): Promise<Ingreso[]> {
    const ingresos = await this.obtenerTodosIngresos();
    return ingresos.filter(i => i.fuente === fuente);
  }

  async obtenerIngresosPorFecha(fechaInicio: Date, fechaFin: Date): Promise<Ingreso[]> {
    const ingresos = await this.obtenerTodosIngresos();
    return ingresos.filter(i => {
      const fecha = new Date(i.fecha);
      return fecha >= fechaInicio && fecha <= fechaFin;
    });
  }

  async obtenerIngresosMes(mes: number, anio: number): Promise<Ingreso[]> {
    const ingresos = await this.obtenerTodosIngresos();
    return ingresos.filter(i => {
      const fecha = new Date(i.fecha);
      return fecha.getMonth() === mes && fecha.getFullYear() === anio;
    });
  }

  async obtenerIngresosAnio(anio: number): Promise<Ingreso[]> {
    const ingresos = await this.obtenerTodosIngresos();
    return ingresos.filter(i => new Date(i.fecha).getFullYear() === anio);
  }

  // ========== CÁLCULOS Y ESTADÍSTICAS ==========
  async calcularTotalIngresos(): Promise<number> {
    const ingresos = await this.obtenerTodosIngresos();
    return ingresos.reduce((total, ingreso) => total + ingreso.monto, 0);
  }

  async calcularTotalIngresosMes(mes: number, anio: number): Promise<number> {
    const ingresos = await this.obtenerIngresosMes(mes, anio);
    return ingresos.reduce((total, ingreso) => total + ingreso.monto, 0);
  }

  async calcularIngresosPorFuente(mes?: number, anio?: number): Promise<{ [fuente: string]: number }> {
    let ingresos: Ingreso[];

    if (mes !== undefined && anio !== undefined) {
      ingresos = await this.obtenerIngresosMes(mes, anio);
    } else {
      ingresos = await this.obtenerTodosIngresos();
    }

    const ingresosPorFuente: { [fuente: string]: number } = {};

    ingresos.forEach(ingreso => {
      if (!ingresosPorFuente[ingreso.fuente]) {
        ingresosPorFuente[ingreso.fuente] = 0;
      }
      ingresosPorFuente[ingreso.fuente] += ingreso.monto;
    });

    return ingresosPorFuente;
  }

  async obtenerTopFuentes(limite: number = 5): Promise<{ fuente: string, total: number }[]> {
    const ingresosPorFuente = await this.calcularIngresosPorFuente();
    const fuentes = Object.entries(ingresosPorFuente)
      .map(([fuente, total]) => ({ fuente, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limite);

    return fuentes;
  }

  // ========== GESTIÓN DE FUENTES ==========
  async obtenerFuentes(): Promise<FuenteIngreso[]> {
    return await this.storage.get(this.FUENTES_KEY) || FUENTES_INGRESO_DEFAULT;
  }

  async agregarFuente(fuente: Omit<FuenteIngreso, 'id'>): Promise<FuenteIngreso> {
    const fuentes = await this.obtenerFuentes();
    const nuevaFuente: FuenteIngreso = {
      ...fuente,
      id: this.generateId()
    };

    fuentes.push(nuevaFuente);
    await this.storage.set(this.FUENTES_KEY, fuentes);
    this.fuentesSubject.next(fuentes);
    return nuevaFuente;
  }

  async eliminarFuente(id: string): Promise<boolean> {
    const fuentes = await this.obtenerFuentes();
    const nuevasFuentes = fuentes.filter(f => f.id !== id);
    await this.storage.set(this.FUENTES_KEY, nuevasFuentes);
    this.fuentesSubject.next(nuevasFuentes);
    return true;
  }

  // ========== UTILIDADES ==========
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async limpiarTodosIngresos(): Promise<void> {
    await this.storage.removeByPrefix(this.INGRESOS_KEY);
    await this.loadIngresos();
  }
}