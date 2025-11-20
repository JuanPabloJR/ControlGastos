// src/app/pages/configuracion/configuracion.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonToggle, IonIcon, IonButton, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonSelect, IonSelectOption, IonInput,
  IonModal, IonButtons, AlertController, ToastController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, notificationsOutline, globeOutline, cashOutline,
  shieldCheckmarkOutline, downloadOutline, trashOutline, logOutOutline,
  moonOutline, sunnyOutline, saveOutline, closeOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth';
import { StorageService } from '../../services/storage.service';
import { NotificacionesService } from '../../services/notificaciones';
import { Usuario, ConfiguracionUsuario } from '../../models/usuario';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonToggle, IonIcon, IonButton, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonSelect, IonSelectOption, IonInput,
    IonModal, IonButtons
  ]
})
export class ConfiguracionPage implements OnInit {
  usuario: Usuario | null = null;
  configuracion: ConfiguracionUsuario | null = null;

  // Modal de perfil
  mostrarModalPerfil = false;
  perfilEdit = {
    nombre: '',
    email: ''
  };

  // Modal de contraseña
  mostrarModalPassword = false;
  passwordEdit = {
    actual: '',
    nueva: '',
    confirmar: ''
  };

  constructor(
    private authService: AuthService,
    private storageService: StorageService,
    private notificacionesService: NotificacionesService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({
      personOutline, notificationsOutline, globeOutline, cashOutline,
      shieldCheckmarkOutline, downloadOutline, trashOutline, logOutOutline,
      moonOutline, sunnyOutline, saveOutline, closeOutline
    });
  }

  async ngOnInit() {
    await this.cargarDatos();
  }

  async ionViewWillEnter() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.usuario = await this.authService.obtenerUsuarioActual();
    this.configuracion = await this.authService.obtenerConfiguracion();
  }

  // ========== PERFIL ==========
  abrirModalPerfil() {
    if (this.usuario) {
      this.perfilEdit = {
        nombre: this.usuario.nombre,
        email: this.usuario.email
      };
      this.mostrarModalPerfil = true;
    }
  }

  cerrarModalPerfil() {
    this.mostrarModalPerfil = false;
  }

  async guardarPerfil() {
    if (!this.perfilEdit.nombre.trim()) {
      this.mostrarToast('El nombre no puede estar vacío', 'warning');
      return;
    }

    if (!this.perfilEdit.email.trim() || !this.validarEmail(this.perfilEdit.email)) {
      this.mostrarToast('Por favor ingresa un email válido', 'warning');
      return;
    }

    const resultado = await this.authService.actualizarPerfil({
      nombre: this.perfilEdit.nombre,
      email: this.perfilEdit.email
    });

    if (resultado.exito) {
      this.mostrarToast('Perfil actualizado correctamente', 'success');
      await this.cargarDatos();
      this.cerrarModalPerfil();
    } else {
      this.mostrarToast(resultado.mensaje, 'danger');
    }
  }

  // ========== CONTRASEÑA ==========
  abrirModalPassword() {
    this.passwordEdit = {
      actual: '',
      nueva: '',
      confirmar: ''
    };
    this.mostrarModalPassword = true;
  }

  cerrarModalPassword() {
    this.mostrarModalPassword = false;
  }

  async cambiarPassword() {
    if (!this.passwordEdit.actual || !this.passwordEdit.nueva || !this.passwordEdit.confirmar) {
      this.mostrarToast('Por favor completa todos los campos', 'warning');
      return;
    }

    if (this.passwordEdit.nueva !== this.passwordEdit.confirmar) {
      this.mostrarToast('Las contraseñas nuevas no coinciden', 'danger');
      return;
    }

    if (this.passwordEdit.nueva.length < 6) {
      this.mostrarToast('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }

    const resultado = await this.authService.cambiarPassword(
      this.passwordEdit.actual,
      this.passwordEdit.nueva
    );

    if (resultado.exito) {
      this.mostrarToast('Contraseña actualizada correctamente', 'success');
      this.cerrarModalPassword();
    } else {
      this.mostrarToast(resultado.mensaje, 'danger');
    }
  }

  // ========== CONFIGURACIÓN ==========
  async actualizarConfiguracion() {
    if (this.configuracion) {
      await this.authService.actualizarConfiguracion(this.configuracion);
      this.mostrarToast('Configuración guardada', 'success');
    }
  }

  async onCambioNotificacionPresupuestos(event: any) {
    if (this.configuracion) {
      this.configuracion.notificaciones.presupuestos = event.detail.checked;
      await this.actualizarConfiguracion();
      // Aquí puedes agregar lógica adicional para manejar notificaciones de presupuestos
    }
  }

  async probarNotificacion() {
    await this.notificacionesService.mostrarNotificacion(
      'Activar Notificaciones',
      'Esta notificacion verifica que las notificaciones funcionan correctamente.'
    );
    this.mostrarToast('Notificación enviada', 'success');
  }

  async cambiarTema(event: any) {
    if (this.configuracion) {
      this.configuracion.tema = event.detail.value;
      await this.actualizarConfiguracion();
      this.aplicarTema(this.configuracion.tema);
    }
  }

  aplicarTema(tema: 'light' | 'dark' | 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    if (tema === 'dark') {
      document.body.classList.add('dark');
    } else if (tema === 'light') {
      document.body.classList.remove('dark');
    } else {
      // auto
      if (prefersDark.matches) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
  }

  // ========== DATOS Y RESPALDO ==========
  async exportarDatos() {
    const alert = await this.alertController.create({
      header: 'Exportar Datos',
      message: 'Se descargará un archivo JSON con todos tus datos.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Exportar',
          handler: async () => {
            try {
              const datos = await this.storageService.exportData();
              this.descargarArchivo(datos, `control-gastos-backup-${Date.now()}.json`);
              this.mostrarToast('Datos exportados correctamente', 'success');
            } catch (error) {
              this.mostrarToast('Error al exportar datos', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async importarDatos() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event: any) => {
          try {
            const jsonData = event.target.result;
            const exito = await this.storageService.importData(jsonData);

            if (exito) {
              this.mostrarToast('Datos importados correctamente', 'success');
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              this.mostrarToast('Error al importar datos', 'danger');
            }
          } catch (error) {
            this.mostrarToast('Archivo inválido', 'danger');
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  }

  async limpiarDatos() {
    const alert = await this.alertController.create({
      header: 'Limpiar Todos los Datos',
      message: '⚠️ Esta acción eliminará TODOS tus datos de forma permanente. ¿Estás seguro?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar Todo',
          role: 'destructive',
          handler: async () => {
            await this.storageService.clear();
            this.mostrarToast('Todos los datos han sido eliminados', 'success');
            await this.authService.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  // ========== SESIÓN ==========
  async cerrarSesion() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          handler: async () => {
            await this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarCuenta() {
    const alert = await this.alertController.create({
      header: 'Eliminar Cuenta',
      message: '⚠️ Esta acción es IRREVERSIBLE. Se eliminarán todos tus datos y tu cuenta.',
      inputs: [
        {
          name: 'confirmacion',
          type: 'text',
          placeholder: 'Escribe "ELIMINAR" para confirmar'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar Cuenta',
          role: 'destructive',
          handler: async (data) => {
            if (data.confirmacion === 'ELIMINAR') {
              await this.authService.eliminarCuenta();
              this.mostrarToast('Cuenta eliminada', 'success');
              this.router.navigate(['/login']);
              return true;  // <-- IMPORTANTE
            } else {
              this.mostrarToast('Confirmación incorrecta', 'warning');
              return false; // <-- PARA QUE NO SE CIERRE EL ALERT
            }
          }

        }
      ]
    });

    await alert.present();
  }

  // ========== UTILIDADES ==========
  descargarArchivo(contenido: string, nombreArchivo: string) {
    const blob = new Blob([contenido], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  validarEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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