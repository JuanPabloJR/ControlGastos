// src/app/pages/presupuestos/presupuestos.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton,
  IonIcon, IonList, IonItem, IonLabel, IonButton, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonChip, IonModal,
  IonButtons, IonInput, IonSelect, IonSelectOption, IonToggle,
  IonRefresher, IonRefresherContent, IonProgressBar, IonBadge,
  AlertController, ToastController, IonItemSliding, IonItemOptions,
  IonItemOption, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, closeOutline, saveOutline, trashOutline,
  createOutline, pieChartOutline, alertCircleOutline,
  checkmarkCircleOutline, warningOutline
} from 'ionicons/icons';
import { PresupuestosService } from '../../services/presupuestos';
import { GastosService } from '../../services/gastos';
import { Presupuesto, ResumenPresupuesto } from '../../models/presupuesto';
import { CategoriaGasto } from '../../models/gasto';

@Component({
  selector: 'app-presupuestos',
  templateUrl: './presupuestos.page.html',
  styleUrls: ['./presupuestos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton,
    IonIcon, IonList, IonItem, IonLabel, IonButton, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonChip, IonModal,
    IonButtons, IonInput, IonSelect, IonSelectOption, IonToggle,
    IonRefresher, IonRefresherContent, IonProgressBar, IonBadge,
    IonItemSliding, IonItemOptions, IonItemOption, IonGrid, IonRow, IonCol
  ]
})
export class PresupuestosPage implements OnInit {
  resumenes: ResumenPresupuesto[] = [];
  categorias: CategoriaGasto[] = [];
  
  // Estadísticas globales
  estadisticas = {
    totalPresupuestado: 0,
    totalGastado: 0,
    totalDisponible: 0,
    porcentajeGlobalUsado: 0
  };
  
  // Modal
  mostrarModal = false;
  modoEdicion = false;
  presupuestoEditando: Presupuesto | null = null;
  
  // Formulario
  nuevoPresupuesto = {
    categoria: '',
    montoAsignado: 0,
    periodo: 'mensual' as 'mensual' | 'semanal' | 'anual',
    alertaActivada: true,
    porcentajeAlerta: 80
  };
  
  mesActual = 0;
  anioActual = 0;

  constructor(
    private presupuestosService: PresupuestosService,
    private gastosService: GastosService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      addOutline, closeOutline, saveOutline, trashOutline,
      createOutline, pieChartOutline, alertCircleOutline,
      checkmarkCircleOutline, warningOutline
    });
  }

  async ngOnInit() {
    this.mesActual = this.presupuestosService.obtenerMesActual();
    this.anioActual = this.presupuestosService.obtenerAnioActual();
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.categorias = await this.gastosService.obtenerCategorias();
    this.resumenes = await this.presupuestosService.calcularResumenTodosPresupuestos();
    this.estadisticas = await this.presupuestosService.obtenerEstadisticasPresupuestos();
    
    // Ordenar por porcentaje usado (más críticos primero)
    this.resumenes.sort((a, b) => b.porcentajeUsado - a.porcentajeUsado);
  }

  abrirModalNuevo() {
    this.modoEdicion = false;
    this.presupuestoEditando = null;
    this.nuevoPresupuesto = {
      categoria: this.categorias.length > 0 ? this.categorias[0].nombre : '',
      montoAsignado: 0,
      periodo: 'mensual',
      alertaActivada: true,
      porcentajeAlerta: 80
    };
    this.mostrarModal = true;
  }

  abrirModalEditar(resumen: ResumenPresupuesto) {
    this.modoEdicion = true;
    this.presupuestoEditando = resumen.presupuesto;
    this.nuevoPresupuesto = {
      categoria: resumen.presupuesto.categoria,
      montoAsignado: resumen.presupuesto.montoAsignado,
      periodo: resumen.presupuesto.periodo,
      alertaActivada: resumen.presupuesto.alertaActivada,
      porcentajeAlerta: resumen.presupuesto.porcentajeAlerta
    };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.presupuestoEditando = null;
  }

  async guardarPresupuesto() {
    if (!this.nuevoPresupuesto.montoAsignado || this.nuevoPresupuesto.montoAsignado <= 0) {
      this.mostrarToast('Por favor ingresa un monto válido', 'warning');
      return;
    }

    if (!this.nuevoPresupuesto.categoria) {
      this.mostrarToast('Por favor selecciona una categoría', 'warning');
      return;
    }

    try {
      if (this.modoEdicion && this.presupuestoEditando) {
        await this.presupuestosService.actualizarPresupuesto(
          this.presupuestoEditando.id,
          {
            categoria: this.nuevoPresupuesto.categoria,
            montoAsignado: this.nuevoPresupuesto.montoAsignado,
            periodo: this.nuevoPresupuesto.periodo,
            alertaActivada: this.nuevoPresupuesto.alertaActivada,
            porcentajeAlerta: this.nuevoPresupuesto.porcentajeAlerta
          }
        );
        this.mostrarToast('Presupuesto actualizado correctamente', 'success');
      } else {
        await this.presupuestosService.crearPresupuesto({
          categoria: this.nuevoPresupuesto.categoria,
          montoAsignado: this.nuevoPresupuesto.montoAsignado,
          periodo: this.nuevoPresupuesto.periodo,
          mes: this.nuevoPresupuesto.periodo === 'mensual' ? this.mesActual : undefined,
          anio: this.anioActual,
          alertaActivada: this.nuevoPresupuesto.alertaActivada,
          porcentajeAlerta: this.nuevoPresupuesto.porcentajeAlerta
        });
        this.mostrarToast('Presupuesto creado correctamente', 'success');
      }

      await this.cargarDatos();
      this.cerrarModal();
    } catch (error) {
      this.mostrarToast('Error al guardar el presupuesto', 'danger');
    }
  }

  async confirmarEliminar(resumen: ResumenPresupuesto) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el presupuesto de ${resumen.presupuesto.categoria}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.eliminarPresupuesto(resumen.presupuesto.id);
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarPresupuesto(id: string) {
    try {
      await this.presupuestosService.eliminarPresupuesto(id);
      this.mostrarToast('Presupuesto eliminado correctamente', 'success');
      await this.cargarDatos();
    } catch (error) {
      this.mostrarToast('Error al eliminar el presupuesto', 'danger');
    }
  }

  async refrescar(event: any) {
    await this.cargarDatos();
    event.target.complete();
  }

  getColorProgreso(porcentaje: number, excedido: boolean): string {
    if (excedido) return 'danger';
    if (porcentaje >= 80) return 'warning';
    if (porcentaje >= 50) return 'primary';
    return 'success';
  }

  getEstadoChip(resumen: ResumenPresupuesto): { texto: string, color: string } {
    if (resumen.excedido) {
      return { texto: 'Excedido', color: 'danger' };
    } else if (resumen.porcentajeUsado >= 80) {
      return { texto: 'Alerta', color: 'warning' };
    } else if (resumen.porcentajeUsado >= 50) {
      return { texto: 'En curso', color: 'primary' };
    } else {
      return { texto: 'Saludable', color: 'success' };
    }
  }

  obtenerIconoCategoria(categoria: string): string {
    const cat = this.categorias.find(c => c.nombre === categoria);
    return cat ? cat.icono : 'pie-chart-outline';
  }

  obtenerColorCategoria(categoria: string): string {
    const cat = this.categorias.find(c => c.nombre === categoria);
    return cat ? cat.color : '#95A5A6';
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'top',
      color: color
    });
    await toast.present();
  }
}