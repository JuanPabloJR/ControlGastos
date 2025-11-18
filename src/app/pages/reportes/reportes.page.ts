// src/app/pages/reportes/reportes.page.ts

import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonSegment,
  IonSegmentButton, IonLabel, IonRefresher, IonRefresherContent,
  IonSelect, IonSelectOption, IonItem, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { GastosService } from '../../services/gastos';
import { IngresosService } from '../../services/ingresos';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonSegment,
    IonSegmentButton, IonLabel, IonRefresher, IonRefresherContent,
    IonSelect, IonSelectOption, IonItem, IonGrid, IonRow, IonCol
  ]
})
export class ReportesPage implements OnInit, AfterViewInit {
  @ViewChild('chartGastosCategorias') chartGastosCategorias!: ElementRef;
  @ViewChild('chartGastosMes') chartGastosMes!: ElementRef;
  @ViewChild('chartIngresosVsGastos') chartIngresosVsGastos!: ElementRef;

  chartGastosCategoriasInstance?: Chart;
  chartGastosMesInstance?: Chart;
  chartIngresosVsGastosInstance?: Chart;

  periodoSeleccionado = 'mes'; // mes, año, todo
  mesSeleccionado = new Date().getMonth();
  anioSeleccionado = new Date().getFullYear();

  // Resumen
  totalGastos = 0;
  totalIngresos = 0;
  balance = 0;

  // Datos para gráficos
  gastosPorCategoria: any = {};
  gastosPorMes: any = {};

  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  anios: number[] = [];

  constructor(
    private gastosService: GastosService,
    private ingresosService: IngresosService
  ) {
    // Generar lista de años (últimos 5 años)
    const anioActual = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.anios.push(anioActual - i);
    }
  }

  async ngOnInit() {
    await this.cargarDatos();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.crearGraficos();
    }, 100);
  }

  async cargarDatos() {
    if (this.periodoSeleccionado === 'mes') {
      await this.cargarDatosMes();
    } else if (this.periodoSeleccionado === 'año') {
      await this.cargarDatosAnio();
    } else {
      await this.cargarTodosDatos();
    }

    this.actualizarGraficos();
  }

  async cargarDatosMes() {
    this.totalGastos = await this.gastosService.calcularTotalGastosMes(
      this.mesSeleccionado,
      this.anioSeleccionado
    );
    this.totalIngresos = await this.ingresosService.calcularTotalIngresosMes(
      this.mesSeleccionado,
      this.anioSeleccionado
    );
    this.balance = this.totalIngresos - this.totalGastos;

    this.gastosPorCategoria = await this.gastosService.calcularGastosPorCategoria(
      this.mesSeleccionado,
      this.anioSeleccionado
    );
  }

  async cargarDatosAnio() {
    const gastos = await this.gastosService.obtenerGastosAnio(this.anioSeleccionado);
    const ingresos = await this.ingresosService.obtenerIngresosAnio(this.anioSeleccionado);

    this.totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    this.totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
    this.balance = this.totalIngresos - this.totalGastos;

    this.gastosPorCategoria = await this.gastosService.calcularGastosPorCategoria();

    // Calcular gastos por mes del año
    this.gastosPorMes = {};
    for (let mes = 0; mes < 12; mes++) {
      const gastosDelMes = gastos.filter(g => new Date(g.fecha).getMonth() === mes);
      const total = gastosDelMes.reduce((sum, g) => sum + g.monto, 0);
      this.gastosPorMes[this.meses[mes]] = total;
    }
  }

  async cargarTodosDatos() {
    this.totalGastos = await this.gastosService.calcularTotalGastos();
    this.totalIngresos = await this.ingresosService.calcularTotalIngresos();
    this.balance = this.totalIngresos - this.totalGastos;

    this.gastosPorCategoria = await this.gastosService.calcularGastosPorCategoria();
  }

  crearGraficos() {
    this.crearGraficoGastosPorCategoria();
    this.crearGraficoGastosPorMes();
    this.crearGraficoIngresosVsGastos();
  }

  actualizarGraficos() {
    if (this.chartGastosCategoriasInstance) {
      this.chartGastosCategoriasInstance.destroy();
    }
    if (this.chartGastosMesInstance) {
      this.chartGastosMesInstance.destroy();
    }
    if (this.chartIngresosVsGastosInstance) {
      this.chartIngresosVsGastosInstance.destroy();
    }

    setTimeout(() => {
      this.crearGraficos();
    }, 100);
  }

  crearGraficoGastosPorCategoria() {
    const categorias = Object.keys(this.gastosPorCategoria);
    const valores = Object.values(this.gastosPorCategoria) as number[];

    if (categorias.length === 0) return;

    const colores = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#A8E6CF', '#FFD3B6', '#FFAAA5', '#95A5A6'
    ];

    const ctx = this.chartGastosCategorias.nativeElement.getContext('2d');
    this.chartGastosCategoriasInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categorias,
        datasets: [{
          data: valores,
          backgroundColor: colores,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  crearGraficoGastosPorMes() {
    if (this.periodoSeleccionado !== 'año') return;

    const meses = Object.keys(this.gastosPorMes);
    const valores = Object.values(this.gastosPorMes) as number[];

    if (meses.length === 0) return;

    const ctx = this.chartGastosMes.nativeElement.getContext('2d');
    this.chartGastosMesInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: meses,
        datasets: [{
          label: 'Gastos',
          data: valores,
          backgroundColor: '#FF6B6B',
          borderColor: '#E74C3C',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  crearGraficoIngresosVsGastos() {
    const ctx = this.chartIngresosVsGastos.nativeElement.getContext('2d');
    this.chartIngresosVsGastosInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Comparación'],
        datasets: [
          {
            label: 'Ingresos',
            data: [this.totalIngresos],
            backgroundColor: '#2ECC71',
            borderColor: '#27AE60',
            borderWidth: 1
          },
          {
            label: 'Gastos',
            data: [this.totalGastos],
            backgroundColor: '#E74C3C',
            borderColor: '#C0392B',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  async onCambioPeriodo(event: any) {
    this.periodoSeleccionado = event.detail.value;
    await this.cargarDatos();
  }

  async onCambioMes(event: any) {
    this.mesSeleccionado = parseInt(event.detail.value);
    await this.cargarDatos();
  }

  async onCambioAnio(event: any) {
    this.anioSeleccionado = parseInt(event.detail.value);
    await this.cargarDatos();
  }

  async refrescar(event: any) {
    await this.cargarDatos();
    event.target.complete();
  }

  ngOnDestroy() {
    if (this.chartGastosCategoriasInstance) {
      this.chartGastosCategoriasInstance.destroy();
    }
    if (this.chartGastosMesInstance) {
      this.chartGastosMesInstance.destroy();
    }
    if (this.chartIngresosVsGastosInstance) {
      this.chartIngresosVsGastosInstance.destroy();
    }
  }
}