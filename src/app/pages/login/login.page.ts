// src/app/pages/login/login.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, personAddOutline, logInOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner
  ]
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';
  nombre: string = '';
  esRegistro: boolean = false;
  cargando: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ mailOutline, lockClosedOutline, personAddOutline, logInOutline });
  }

  ngOnInit() {}

  async login() {
    if (!this.validarFormulario()) return;

    this.cargando = true;
    const resultado = await this.authService.login(this.email, this.password);
    this.cargando = false;

    if (resultado.exito) {
      await this.mostrarToast(resultado.mensaje, 'success');
      this.router.navigate(['/tabs/home']);
    } else {
      await this.mostrarAlerta('Error', resultado.mensaje);
    }
  }

  async registrar() {
    if (!this.validarFormulario(true)) return;

    this.cargando = true;
    const resultado = await this.authService.registrar({
      nombre: this.nombre,
      email: this.email,
      password: this.password,
      moneda: 'MXN',
      idioma: 'es',
      notificacionesActivas: true,
      biometriaActiva: false
    });
    this.cargando = false;

    if (resultado.exito) {
      await this.mostrarToast('Registro exitoso. Ahora inicia sesión', 'success');
      this.cambiarModo();
    } else {
      await this.mostrarAlerta('Error', resultado.mensaje);
    }
  }

  validarFormulario(esRegistro: boolean = false): boolean {
    if (esRegistro && !this.nombre.trim()) {
      this.mostrarAlerta('Error', 'El nombre es requerido');
      return false;
    }

    if (!this.email.trim()) {
      this.mostrarAlerta('Error', 'El email es requerido');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.mostrarAlerta('Error', 'El email no es válido');
      return false;
    }

    if (!this.password) {
      this.mostrarAlerta('Error', 'La contraseña es requerida');
      return false;
    }

    if (this.password.length < 6) {
      this.mostrarAlerta('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  }

  cambiarModo() {
    this.esRegistro = !this.esRegistro;
    this.limpiarFormulario();
  }

  limpiarFormulario() {
    this.nombre = '';
    this.email = '';
    this.password = '';
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  async mostrarToast(mensaje: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'top',
      color: color
    });
    await toast.present();
  }
}