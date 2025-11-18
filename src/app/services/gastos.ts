// src/app/services/gastos.service.ts

import { Injectable, Inject, Optional } from '@angular/core';
import { StorageService } from './storage.service';
import { Gasto, CategoriaGasto, CATEGORIAS_GASTO_DEFAULT } from '../models/gasto';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GastosService {
  private notificacionesService: any = null;
  private readonly GASTOS_KEY = 'gastos_';
  private readonly CATEGORIAS_KEY = 'categorias_gasto';
  
  private gastosSubject = new BehaviorSubject<Gasto[]>([]);
  public gastos$: Observable<Gasto[]> = this.gastosSubject.asObservable();
  
  private categoriasSubject = new BehaviorSubject<CategoriaGasto[]>([]);
  public categorias$: Observable<CategoriaGasto[]> = this.categoriasSubject.asObservable();

  constructor(private storage: StorageService) {
    this.initCategorias();
    this.loadGastos();
  }

  // ========== INICIALIZACIÓN ==========
  private async initCategorias(): Promise<void> {
    let categorias = await this.storage.get(this.CATEGORIAS_KEY);
    if (!categorias || categorias.length === 0) {
      categorias = CATEGORIAS_GASTO_DEFAULT;
      await this.storage.set(this.CATEGORIAS_KEY, categorias);
    }
    this.categoriasSubject.next(categorias);
  }

  private async loadGastos(): Promise<void> {
    const gastos = await this.storage.getAllByPrefix(this.GASTOS_KEY);
    this.gastosSubject.next(gastos);
  }

  // ========== CRUD GASTOS ==========
  async agregarGasto(gasto: Omit<Gasto, 'id' | 'createdAt' | 'updatedAt'>): Promise<Gasto> {
    const nuevoGasto: Gasto = {
      ...gasto,
      id: this.generateId(),
      fecha: new Date(gasto.fecha),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.set(this.GASTOS_KEY + nuevoGasto.id, nuevoGasto);
    await this.loadGastos();
    return nuevoGasto;
  }

  async obtenerGasto(id: string): Promise<Gasto | null> {
    return await this.storage.get(this.GASTOS_KEY + id);
  }

  async obtenerTodosGastos(): Promise<Gasto[]> {
    return await this.storage.getAllByPrefix(this.GASTOS_KEY);
  }

  async actualizarGasto(id: string, gasto: Partial<Gasto>): Promise<Gasto | null> {
    const gastoExistente = await this.obtenerGasto(id);
    if (!gastoExistente) return null;

    const gastoActualizado: Gasto = {
      ...gastoExistente,
      ...gasto,
      id: gastoExistente.id,
      updatedAt: new Date()
    };

    await this.storage.set(this.GASTOS_KEY + id, gastoActualizado);
    await this.loadGastos();
    return gastoActualizado;
  }

  async eliminarGasto(id: string): Promise<boolean> {
    await this.storage.remove(this.GASTOS_KEY + id);
    await this.loadGastos();
    return true;
  }

  // ========== FILTROS Y BÚSQUEDAS ==========
  async obtenerGastosPorCategoria(categoria: string): Promise<Gasto[]> {
    const gastos = await this.obtenerTodosGastos();
    return gastos.filter(g => g.categoria === categoria);
  }

  async obtenerGastosPorFecha(fechaInicio: Date, fechaFin: Date): Promise<Gasto[]> {
    const gastos = await this.obtenerTodosGastos();
    return gastos.filter(g => {
      const fecha = new Date(g.fecha);
      return fecha >= fechaInicio && fecha <= fechaFin;
    });
  }

  async obtenerGastosMes(mes: number, anio: number): Promise<Gasto[]> {
    const gastos = await this.obtenerTodosGastos();
    return gastos.filter(g => {
      const fecha = new Date(g.fecha);
      return fecha.getMonth() === mes && fecha.getFullYear() === anio;
    });
  }

  async obtenerGastosAnio(anio: number): Promise<Gasto[]> {
    const gastos = await this.obtenerTodosGastos();
    return gastos.filter(g => new Date(g.fecha).getFullYear() === anio);
  }

  // ========== CÁLCULOS Y ESTADÍSTICAS ==========
  async calcularTotalGastos(): Promise<number> {
    const gastos = await this.obtenerTodosGastos();
    return gastos.reduce((total, gasto) => total + gasto.monto, 0);
  }

  async calcularTotalGastosMes(mes: number, anio: number): Promise<number> {
    const gastos = await this.obtenerGastosMes(mes, anio);
    return gastos.reduce((total, gasto) => total + gasto.monto, 0);
  }

  async calcularGastosPorCategoria(mes?: number, anio?: number): Promise<{ [categoria: string]: number }> {
    let gastos: Gasto[];
    
    if (mes !== undefined && anio !== undefined) {
      gastos = await this.obtenerGastosMes(mes, anio);
    } else {
      gastos = await this.obtenerTodosGastos();
    }

    const gastosPorCategoria: { [categoria: string]: number } = {};
    
    gastos.forEach(gasto => {
      if (!gastosPorCategoria[gasto.categoria]) {
        gastosPorCategoria[gasto.categoria] = 0;
      }
      gastosPorCategoria[gasto.categoria] += gasto.monto;
    });

    return gastosPorCategoria;
  }

  async obtenerTopCategorias(limite: number = 5): Promise<{ categoria: string, total: number }[]> {
    const gastosPorCategoria = await this.calcularGastosPorCategoria();
    const categorias = Object.entries(gastosPorCategoria)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limite);
    
    return categorias;
  }

  // ========== GESTIÓN DE CATEGORÍAS ==========
  async obtenerCategorias(): Promise<CategoriaGasto[]> {
    return await this.storage.get(this.CATEGORIAS_KEY) || CATEGORIAS_GASTO_DEFAULT;
  }

  async agregarCategoria(categoria: Omit<CategoriaGasto, 'id'>): Promise<CategoriaGasto> {
    const categorias = await this.obtenerCategorias();
    const nuevaCategoria: CategoriaGasto = {
      ...categoria,
      id: this.generateId()
    };
    
    categorias.push(nuevaCategoria);
    await this.storage.set(this.CATEGORIAS_KEY, categorias);
    this.categoriasSubject.next(categorias);
    return nuevaCategoria;
  }

  async eliminarCategoria(id: string): Promise<boolean> {
    const categorias = await this.obtenerCategorias();
    const nuevasCategorias = categorias.filter(c => c.id !== id);
    await this.storage.set(this.CATEGORIAS_KEY, nuevasCategorias);
    this.categoriasSubject.next(nuevasCategorias);
    return true;
  }

  // ========== UTILIDADES ==========
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async limpiarTodosGastos(): Promise<void> {
    await this.storage.removeByPrefix(this.GASTOS_KEY);
    await this.loadGastos();
  }
}