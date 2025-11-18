// src/app/services/notificaciones.service.ts

import { Injectable } from '@angular/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { PresupuestosService } from './presupuestos';
import { Platform } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private notificacionesHabilitadas = false;

  constructor(
    private presupuestosService: PresupuestosService,
    private platform: Platform
  ) {
    this.inicializar();
  }

  // ========== INICIALIZACIÓN ==========
  async inicializar() {
    // Solo en dispositivos móviles
    if (this.platform.is('capacitor')) {
      await this.solicitarPermisos();
      await this.configurarListeners();
    }
  }

  async solicitarPermisos(): Promise<boolean> {
    try {
      const permiso = await LocalNotifications.requestPermissions();
      this.notificacionesHabilitadas = permiso.display === 'granted';
      return this.notificacionesHabilitadas;
    } catch (error) {
      console.error('Error solicitando permisos de notificaciones:', error);
      return false;
    }
  }

  async configurarListeners() {
    // Listener cuando se toca una notificación
    await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Notificación tocada:', notification);
      // Aquí puedes navegar a una página específica si lo deseas
    });
  }

  // ========== NOTIFICACIONES DE PRESUPUESTOS ==========
  async verificarYNotificarPresupuestos(): Promise<void> {
    if (!this.notificacionesHabilitadas && !this.platform.is('capacitor')) {
      // En web, mostrar notificaciones del navegador
      this.verificarPresupuestosWeb();
      return;
    }

    const alertas = await this.presupuestosService.verificarAlertas();
    
    if (alertas.length === 0) return;

    const notificaciones: ScheduleOptions = {
      notifications: []
    };

    alertas.forEach((alerta, index) => {
      const esExcedido = alerta.tipo === 'excedido';
      const categoria = alerta.resumen.presupuesto.categoria;
      const porcentaje = alerta.resumen.porcentajeUsado.toFixed(1);

      notificaciones.notifications.push({
        id: Date.now() + index,
        title: esExcedido ? '⚠️ Presupuesto Excedido' : '⚡ Alerta de Presupuesto',
        body: esExcedido
          ? `Has excedido el presupuesto de ${categoria} en un ${porcentaje}%`
          : `Tu presupuesto de ${categoria} está al ${porcentaje}%`,
        schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo después
        sound: undefined,
        attachments: undefined,
        actionTypeId: '',
        extra: {
          categoria: categoria,
          tipo: alerta.tipo
        }
      });
    });

    try {
      await LocalNotifications.schedule(notificaciones);
    } catch (error) {
      console.error('Error programando notificaciones:', error);
    }
  }

  // ========== NOTIFICACIONES WEB (Fallback) ==========
  async verificarPresupuestosWeb(): Promise<void> {
    const alertas = await this.presupuestosService.verificarAlertas();
    
    if (alertas.length === 0) return;

    // Solicitar permiso de notificaciones del navegador
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      alertas.forEach((alerta) => {
        const esExcedido = alerta.tipo === 'excedido';
        const categoria = alerta.resumen.presupuesto.categoria;
        const porcentaje = alerta.resumen.porcentajeUsado.toFixed(1);

        new Notification(
          esExcedido ? '⚠️ Presupuesto Excedido' : '⚡ Alerta de Presupuesto',
          {
            body: esExcedido
              ? `Has excedido el presupuesto de ${categoria} en un ${porcentaje}%`
              : `Tu presupuesto de ${categoria} está al ${porcentaje}%`,
            icon: '/assets/icon/favicon.png',
            badge: '/assets/icon/favicon.png'
          }
        );
      });
    }
  }

  // ========== NOTIFICACIÓN INMEDIATA ==========
  async mostrarNotificacion(titulo: string, mensaje: string): Promise<void> {
    if (!this.platform.is('capacitor')) {
      // Notificación web
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(titulo, {
          body: mensaje,
          icon: '/assets/icon/favicon.png'
        });
      }
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: titulo,
            body: mensaje,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Error mostrando notificación:', error);
    }
  }

  // ========== NOTIFICACIÓN DE RECORDATORIO ==========
  async programarRecordatorio(titulo: string, mensaje: string, fecha: Date): Promise<void> {
    if (!this.platform.is('capacitor')) {
      console.log('Recordatorios solo disponibles en dispositivos móviles');
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: titulo,
            body: mensaje,
            schedule: { at: fecha },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Error programando recordatorio:', error);
    }
  }

  // ========== NOTIFICACIONES DIARIAS ==========
  async programarResumenDiario(hora: number = 16): Promise<void> {
    if (!this.platform.is('capacitor')) return;

    // Programar notificación diaria a las 8 PM (por ejemplo)
    const ahora = new Date();
    const horaNotificacion = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      hora,
      0,
      0
    );

    // Si ya pasó la hora de hoy, programar para mañana
    if (horaNotificacion < ahora) {
      horaNotificacion.setDate(horaNotificacion.getDate() + 1);
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999, // ID fijo para el resumen diario
            title: '📊 Resumen del Día',
            body: 'Revisa tu actividad financiera de hoy',
            schedule: {
              at: horaNotificacion,
              every: 'day'
            },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Error programando resumen diario:', error);
    }
  }

  async cancelarResumenDiario(): Promise<void> {
    if (!this.platform.is('capacitor')) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id: 999 }] });
    } catch (error) {
      console.error('Error cancelando resumen diario:', error);
    }
  }

  // ========== LIMPIAR NOTIFICACIONES ==========
  async limpiarTodasNotificaciones(): Promise<void> {
    if (!this.platform.is('capacitor')) return;

    try {
      await LocalNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
    }
  }

  // ========== VERIFICAR ESTADO ==========
  async estanHabilitadas(): Promise<boolean> {
    if (!this.platform.is('capacitor')) {
      return 'Notification' in window && Notification.permission === 'granted';
    }

    try {
      const permiso = await LocalNotifications.checkPermissions();
      return permiso.display === 'granted';
    } catch (error) {
      return false;
    }
  }
}