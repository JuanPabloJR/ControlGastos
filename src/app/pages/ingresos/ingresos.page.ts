// src/app/pages/ingresos/ingresos.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton,
  IonIcon, IonList, IonItem, IonLabel, IonButton, IonSearchbar,
  IonSegment, IonSegmentButton, IonCard, IonCardContent, IonChip,
  IonModal, IonButtons, IonInput, IonTextarea, IonDatetime,
  IonSelect, IonSelectOption, IonRefresher, IonRefresherContent,
  ModalController, AlertController, ToastController, IonItemSliding,
  IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, searchOutline, filterOutline, trashOutline,
  createOutline, closeOutline, saveOutline, walletOutline
} from 'ionicons/icons';
import { IngresosService } from '../../services/ingresos';
import { Ingreso, FuenteIngreso } from '../../models/ingreso';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.page.html',
  styleUrls: ['./ingresos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton,
    IonIcon, IonList, IonItem, IonLabel, IonButton, IonSearchbar,
    IonSegment, IonSegmentButton, IonCard, IonCardContent, IonChip,
    IonModal, IonButtons, IonInput, IonTextarea, IonDatetime,
    IonSelect, IonSelectOption, IonRefresher, IonRefresherContent,
    IonItemSliding, IonItemOptions, IonItemOption
  ]
})
export class IngresosPage implements OnInit {
  ingresos: Ingreso[] = [];
  ingresosFiltrados: Ingreso[] = [];
  fuentes: FuenteIngreso[] = [];
  
  // Filtros
  terminoBusqueda = '';
  fuenteFiltro = 'todos';
  periodoFiltro = 'mes';
  
  // Modal
  mostrarModal = false;
  modoEdicion = false;
  ingresoEditando: Ingreso | null = null;
  
  // Formulario
  nuevoIngreso = {
    monto: 0,
    fuente: '',
    fecha: new Date().toISOString(),
    descripcion: ''
  };
  
  // Estadísticas
  totalIngresos = 0;

  constructor(
    private ingresosService: IngresosService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      addOutline, searchOutline, filterOutline, trashOutline,
      createOutline, closeOutline, saveOutline, walletOutline
    });
  }

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.fuentes = await this.ingresosService.obtenerFuentes();
    this.ingresos = await this.ingresosService.obtenerTodosIngresos();
    this.aplicarFiltros();
    this.calcularTotal();
  }

  aplicarFiltros() {
    let resultado = [...this.ingresos];
    
    // Filtrar por periodo
    if (this.periodoFiltro === 'mes') {
      const ahora = new Date();
      resultado = resultado.filter(i => {
        const fecha = new Date(i.fecha);
        return fecha.getMonth() === ahora.getMonth() && 
               fecha.getFullYear() === ahora.getFullYear();
      });
    } else if (this.periodoFiltro === 'semana') {
      const ahora = new Date();
      const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      resultado = resultado.filter(i => new Date(i.fecha) >= hace7Dias);
    }
    
    // Filtrar por fuente
    if (this.fuenteFiltro !== 'todos') {
      resultado = resultado.filter(i => i.fuente === this.fuenteFiltro);
    }
    
    // Filtrar por búsqueda
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(i =>
        i.fuente.toLowerCase().includes(termino) ||
        (i.descripcion && i.descripcion.toLowerCase().includes(termino))
      );
    }
    
    // Ordenar por fecha (más recientes primero)
    resultado.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    this.ingresosFiltrados = resultado;
  }

  calcularTotal() {
    this.totalIngresos = this.ingresosFiltrados.reduce((sum, i) => sum + i.monto, 0);
  }

  onBuscar(event: any) {
    this.terminoBusqueda = event.target.value || '';
    this.aplicarFiltros();
    this.calcularTotal();
  }

  onCambiarPeriodo(event: any) {
    this.periodoFiltro = event.detail.value;
    this.aplicarFiltros();
    this.calcularTotal();
  }

  onCambiarFuente(event: any) {
    this.fuenteFiltro = event.detail.value;
    this.aplicarFiltros();
    this.calcularTotal();
  }

  abrirModalNuevo() {
    this.modoEdicion = false;
    this.ingresoEditando = null;
    this.nuevoIngreso = {
      monto: 0,
      fuente: this.fuentes.length > 0 ? this.fuentes[0].nombre : '',
      fecha: new Date().toISOString(),
      descripcion: ''
    };
    this.mostrarModal = true;
  }

  abrirModalEditar(ingreso: Ingreso) {
    this.modoEdicion = true;
    this.ingresoEditando = ingreso;
    this.nuevoIngreso = {
      monto: ingreso.monto,
      fuente: ingreso.fuente,
      fecha: new Date(ingreso.fecha).toISOString(),
      descripcion: ingreso.descripcion || ''
    };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.ingresoEditando = null;
  }

  async guardarIngreso() {
    if (!this.nuevoIngreso.monto || this.nuevoIngreso.monto <= 0) {
      this.mostrarToast('Por favor ingresa un monto válido', 'warning');
      return;
    }

    if (!this.nuevoIngreso.fuente) {
      this.mostrarToast('Por favor selecciona una fuente', 'warning');
      return;
    }

    try {
      if (this.modoEdicion && this.ingresoEditando) {
        await this.ingresosService.actualizarIngreso(this.ingresoEditando.id, {
          monto: this.nuevoIngreso.monto,
          fuente: this.nuevoIngreso.fuente,
          fecha: new Date(this.nuevoIngreso.fecha),
          descripcion: this.nuevoIngreso.descripcion
        });
        this.mostrarToast('Ingreso actualizado correctamente', 'success');
      } else {
        await this.ingresosService.agregarIngreso({
          monto: this.nuevoIngreso.monto,
          fuente: this.nuevoIngreso.fuente,
          fecha: new Date(this.nuevoIngreso.fecha),
          descripcion: this.nuevoIngreso.descripcion
        });
        this.mostrarToast('Ingreso agregado correctamente', 'success');
      }

      await this.cargarDatos();
      this.cerrarModal();
    } catch (error) {
      this.mostrarToast('Error al guardar el ingreso', 'danger');
    }
  }

  async confirmarEliminar(ingreso: Ingreso) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el ingreso de $${ingreso.monto.toFixed(2)}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.eliminarIngreso(ingreso.id);
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarIngreso(id: string) {
    try {
      await this.ingresosService.eliminarIngreso(id);
      this.mostrarToast('Ingreso eliminado correctamente', 'success');
      await this.cargarDatos();
    } catch (error) {
      this.mostrarToast('Error al eliminar el ingreso', 'danger');
    }
  }

  async refrescar(event: any) {
    await this.cargarDatos();
    event.target.complete();
  }

  formatearFecha(fecha: Date): string {
    const f = new Date(fecha);
    return f.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  }

  obtenerIconoFuente(fuente: string): string {
    const f = this.fuentes.find(fu => fu.nombre === fuente);
    return f ? f.icono : 'wallet-outline';
  }

  obtenerColorFuente(fuente: string): string {
    const f = this.fuentes.find(fu => fu.nombre === fuente);
    return f ? f.color : '#2ECC71';
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