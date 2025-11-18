// src/app/pages/gastos/gastos.page.ts

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
  createOutline, closeOutline, saveOutline, cashOutline
} from 'ionicons/icons';
import { GastosService } from '../../services/gastos';
import { Gasto, CategoriaGasto } from '../../models/gasto';

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.page.html',
  styleUrls: ['./gastos.page.scss'],
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
export class GastosPage implements OnInit {
  gastos: Gasto[] = [];
  gastosFiltrados: Gasto[] = [];
  categorias: CategoriaGasto[] = [];
  
  // Filtros
  terminoBusqueda = '';
  categoriaFiltro = 'todos';
  periodoFiltro = 'mes'; // mes, semana, todos
  
  // Modal
  mostrarModal = false;
  modoEdicion = false;
  gastoEditando: Gasto | null = null;
  
  // Formulario
  nuevoGasto = {
    monto: 0,
    categoria: '',
    fecha: new Date().toISOString(),
    descripcion: ''
  };
  
  // Estadísticas
  totalGastos = 0;

  constructor(
    private gastosService: GastosService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      addOutline, searchOutline, filterOutline, trashOutline,
      createOutline, closeOutline, saveOutline, cashOutline
    });
  }

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.categorias = await this.gastosService.obtenerCategorias();
    this.gastos = await this.gastosService.obtenerTodosGastos();
    this.aplicarFiltros();
    this.calcularTotal();
  }

  aplicarFiltros() {
    let resultado = [...this.gastos];
    
    // Filtrar por periodo
    if (this.periodoFiltro === 'mes') {
      const ahora = new Date();
      resultado = resultado.filter(g => {
        const fecha = new Date(g.fecha);
        return fecha.getMonth() === ahora.getMonth() && 
               fecha.getFullYear() === ahora.getFullYear();
      });
    } else if (this.periodoFiltro === 'semana') {
      const ahora = new Date();
      const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      resultado = resultado.filter(g => new Date(g.fecha) >= hace7Dias);
    }
    
    // Filtrar por categoría
    if (this.categoriaFiltro !== 'todos') {
      resultado = resultado.filter(g => g.categoria === this.categoriaFiltro);
    }
    
    // Filtrar por búsqueda
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(g =>
        g.categoria.toLowerCase().includes(termino) ||
        (g.descripcion && g.descripcion.toLowerCase().includes(termino))
      );
    }
    
    // Ordenar por fecha (más recientes primero)
    resultado.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    this.gastosFiltrados = resultado;
  }

  calcularTotal() {
    this.totalGastos = this.gastosFiltrados.reduce((sum, g) => sum + g.monto, 0);
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

  onCambiarCategoria(event: any) {
    this.categoriaFiltro = event.detail.value;
    this.aplicarFiltros();
    this.calcularTotal();
  }

  abrirModalNuevo() {
    this.modoEdicion = false;
    this.gastoEditando = null;
    this.nuevoGasto = {
      monto: 0,
      categoria: this.categorias.length > 0 ? this.categorias[0].nombre : '',
      fecha: new Date().toISOString(),
      descripcion: ''
    };
    this.mostrarModal = true;
  }

  abrirModalEditar(gasto: Gasto) {
    this.modoEdicion = true;
    this.gastoEditando = gasto;
    this.nuevoGasto = {
      monto: gasto.monto,
      categoria: gasto.categoria,
      fecha: new Date(gasto.fecha).toISOString(),
      descripcion: gasto.descripcion || ''
    };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.gastoEditando = null;
  }

  async guardarGasto() {
    if (!this.nuevoGasto.monto || this.nuevoGasto.monto <= 0) {
      this.mostrarToast('Por favor ingresa un monto válido', 'warning');
      return;
    }

    if (!this.nuevoGasto.categoria) {
      this.mostrarToast('Por favor selecciona una categoría', 'warning');
      return;
    }

    try {
      if (this.modoEdicion && this.gastoEditando) {
        await this.gastosService.actualizarGasto(this.gastoEditando.id, {
          monto: this.nuevoGasto.monto,
          categoria: this.nuevoGasto.categoria,
          fecha: new Date(this.nuevoGasto.fecha),
          descripcion: this.nuevoGasto.descripcion
        });
        this.mostrarToast('Gasto actualizado correctamente', 'success');
      } else {
        await this.gastosService.agregarGasto({
          monto: this.nuevoGasto.monto,
          categoria: this.nuevoGasto.categoria,
          fecha: new Date(this.nuevoGasto.fecha),
          descripcion: this.nuevoGasto.descripcion
        });
        this.mostrarToast('Gasto agregado correctamente', 'success');
      }

      await this.cargarDatos();
      this.cerrarModal();
    } catch (error) {
      this.mostrarToast('Error al guardar el gasto', 'danger');
    }
  }

  async confirmarEliminar(gasto: Gasto) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el gasto de $${gasto.monto.toFixed(2)}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.eliminarGasto(gasto.id);
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarGasto(id: string) {
    try {
      await this.gastosService.eliminarGasto(id);
      this.mostrarToast('Gasto eliminado correctamente', 'success');
      await this.cargarDatos();
    } catch (error) {
      this.mostrarToast('Error al eliminar el gasto', 'danger');
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

  obtenerIconoCategoria(categoria: string): string {
    const cat = this.categorias.find(c => c.nombre === categoria);
    return cat ? cat.icono : 'cash-outline';
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