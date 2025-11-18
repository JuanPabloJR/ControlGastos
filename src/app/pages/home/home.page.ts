// src/app/pages/home/home.page.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonIcon,
  IonButton, IonRefresher, IonRefresherContent, IonChip, IonLabel,
  IonList, IonItem, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  walletOutline, trendingUpOutline, trendingDownOutline,
  calendarOutline, addCircleOutline, removeCircleOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { GastosService } from '../../services/gastos';
import { IngresosService } from '../../services/ingresos';
import { PresupuestosService } from '../../services/presupuestos';
import { AuthService } from '../../services/auth';
import { NotificacionesService } from '../../services/notificaciones';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonIcon,
    IonButton, IonRefresher, IonRefresherContent, IonChip, IonLabel,
    IonList, IonItem, IonText
  ]
})
export class HomePage {
  usuario: Usuario | null = null;
  
  // Resumen financiero
  totalIngresos = 0;
  totalGastos = 0;
  balance = 0;
  
  // Mes actual
  mesActual = '';
  anioActual = 0;
  
  // Últimas transacciones
  ultimosGastos: any[] = [];
  ultimosIngresos: any[] = [];
  
  // Alertas de presupuestos
  alertasPresupuesto: any[] = [];
  
  cargando = true;

  constructor(
    private gastosService: GastosService,
    private ingresosService: IngresosService,
    private presupuestosService: PresupuestosService,
    private authService: AuthService,
    private router: Router,
    private notificacionesService: NotificacionesService
  ) {
    addIcons({
      walletOutline, trendingUpOutline, trendingDownOutline,
      calendarOutline, addCircleOutline, removeCircleOutline,
      alertCircleOutline
    });
  }

  async ionViewWillEnter() {
    await this.cargarDatos();
    // Verificar y mostrar notificaciones de presupuesto
    this.notificacionesService.verificarYNotificarPresupuestos();
  }

  async cargarDatos() {
    this.cargando = true;
    
    // Obtener usuario
    this.usuario = await this.authService.obtenerUsuarioActual();
    
    // Obtener mes y año actual
    const fecha = new Date();
    this.anioActual = fecha.getFullYear();
    const mes = fecha.getMonth();
    this.mesActual = this.obtenerNombreMes(mes);
    
    // Cargar resumen financiero del mes actual
    this.totalIngresos = await this.ingresosService.calcularTotalIngresosMes(mes, this.anioActual);
    this.totalGastos = await this.gastosService.calcularTotalGastosMes(mes, this.anioActual);
    this.balance = this.totalIngresos - this.totalGastos;
    
    // Cargar últimas transacciones
    await this.cargarUltimasTransacciones();
    
    // Cargar alertas de presupuestos
    await this.cargarAlertasPresupuesto();
    
    this.cargando = false;
  }

  async cargarUltimasTransacciones() {
    const todosGastos = await this.gastosService.obtenerTodosGastos();
    const todosIngresos = await this.ingresosService.obtenerTodosIngresos();
    
    // Ordenar por fecha (más recientes primero)
    this.ultimosGastos = todosGastos
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 3);
      
    this.ultimosIngresos = todosIngresos
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 3);
  }

  async cargarAlertasPresupuesto() {
    const alertas = await this.presupuestosService.verificarAlertas();
    this.alertasPresupuesto = alertas.slice(0, 3); // Mostrar máximo 3
  }

  async refrescar(event: any) {
    await this.cargarDatos();
    event.target.complete();
  }

  obtenerNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes];
  }

  formatearFecha(fecha: Date): string {
    const f = new Date(fecha);
    return f.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  navegarA(ruta: string) {
    this.router.navigate([`/tabs/${ruta}`]);
  }

  get colorBalance(): string {
    if (this.balance > 0) return 'success';
    if (this.balance < 0) return 'danger';
    return 'medium';
  }
}