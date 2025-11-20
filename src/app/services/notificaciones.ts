// src/app/services/notificaciones.service.ts

import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PresupuestosService } from './presupuestos';
import { Platform } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private notificacionesHabilitadas = false;
  private plataformaLista = false;

  constructor(
    private presupuestosService: PresupuestosService,
    private platform: Platform
  ) {
    // NO llamar a inicializar aquí para evitar race conditions.
    // AppComponent se encargará de llamarlo y esperarlo.
  }

  // ========== INICIALIZACIÓN ==========
  async inicializar() {
    // Esperar a que la plataforma esté lista
    await this.platform.ready();
    this.plataformaLista = true;
    
    // Solo en dispositivos móviles
    if (this.platform.is('capacitor')) {
      await this.solicitarPermisos();
      await this.configurarListeners();
    }
  }

  async solicitarPermisos(): Promise<boolean> {
    if (!this.platform.is('capacitor')) {
      console.log('Notificaciones solo disponibles en Capacitor');
      return false;
    }

    try {
      const permiso = await LocalNotifications.requestPermissions();
      this.notificacionesHabilitadas = permiso.display === 'granted';
      
      if (this.notificacionesHabilitadas) {
        console.log('✅ Permisos de notificaciones concedidos');
      } else {
        console.log('❌ Permisos de notificaciones denegados');
      }
      
      return this.notificacionesHabilitadas;
    } catch (error) {
      console.error('Error solicitando permisos de notificaciones:', error);
      return false;
    }
  }

  async configurarListeners() {
    if (!this.platform.is('capacitor')) return;

    // Listener cuando se toca una notificación
    await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('📱 Notificación tocada:', notification);
    });
  }

  // ========== NOTIFICACIONES DE PRESUPUESTOS ==========
  async verificarYNotificarPresupuestos(): Promise<void> {
    if (!this.plataformaLista) {
      console.log('⏳ Esperando a que la plataforma esté lista...');
      await this.platform.ready();
      this.plataformaLista = true;
    }

    if (!this.platform.is('capacitor')) {
      console.log('🌐 Modo Web - Usando notificaciones del navegador');
      this.verificarPresupuestosWeb();
      return;
    }

    if (!this.notificacionesHabilitadas) {
      console.log('⚠️ Notificaciones no habilitadas');
      return;
    }

    const alertas = await this.presupuestosService.verificarAlertas();
    
    if (alertas.length === 0) {
      console.log('✅ No hay alertas de presupuestos');
      return;
    }

    console.log(`📊 ${alertas.length} alertas de presupuesto encontradas`);

    for (let index = 0; index < alertas.length; index++) {
      const alerta = alertas[index];
      const esExcedido = alerta.tipo === 'excedido';
      const categoria = alerta.resumen.presupuesto.categoria;
      const porcentaje = alerta.resumen.porcentajeUsado.toFixed(1);

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: esExcedido ? '⚠️ Presupuesto Excedido' : '⚡ Alerta de Presupuesto',
              body: esExcedido
                ? `Has excedido el presupuesto de ${categoria} en un ${porcentaje}%`
                : `Tu presupuesto de ${categoria} está al ${porcentaje}%`,
              // ⭐ CORRECCIÓN: Generar un ID que quepa en un Java int (32-bit)
              // Se usan los últimos 9 dígitos del tiempo actual + el índice para asegurar unicidad.
              id: parseInt(String(Date.now()).substring(4)) + index,
              schedule: { at: new Date(Date.now() + 1000 * (index + 1)) }, // 1 segundo entre cada una
              sound: undefined,
              attachments: undefined,
              actionTypeId: '',
              extra: {
                categoria: categoria,
                tipo: alerta.tipo
              }
            }
          ]
        });

        console.log(`✅ Notificación programada para ${categoria}`);
      } catch (error) {
        console.error('❌ Error programando notificación:', error);
      }
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
    if (!this.plataformaLista) {
      await this.platform.ready();
      this.plataformaLista = true;
    }

    if (!this.platform.is('capacitor')) {
      console.log('🌐 Notificación Web:', titulo, mensaje);
      // Notificación web
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(titulo, {
          body: mensaje,
          icon: '/assets/icon/favicon.png'
        });
      }
      return;
    }

    if (!this.notificacionesHabilitadas) {
      console.log('⚠️ Notificaciones no habilitadas');
      const permisoOtorgado = await this.solicitarPermisos();
      if (!permisoOtorgado) {
        console.log('❌ Usuario no otorgó permisos');
        return;
      }
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: titulo,
            body: mensaje,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo después
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });

      console.log('✅ Notificación programada exitosamente');
    } catch (error) {
      console.error('❌ Error mostrando notificación:', error);
    }
  }

  // ========== NOTIFICACIÓN DE RECORDATORIO ==========
  async programarRecordatorio(titulo: string, mensaje: string, fecha: Date): Promise<void> {
    if (!this.platform.is('capacitor')) {
      console.log('🌐 Recordatorios solo disponibles en dispositivos móviles');
      return;
    }

    if (!this.notificacionesHabilitadas) {
      await this.solicitarPermisos();
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: titulo,
            body: mensaje,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: fecha },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
      console.log('✅ Recordatorio programado para:', fecha);
    } catch (error) {
      console.error('❌ Error programando recordatorio:', error);
    }
  }

  // ========== NOTIFICACIONES DIARIAS ==========
  async programarResumenDiario(hora: number = 20): Promise<void> {
    if (!this.platform.is('capacitor')) return;

    if (!this.notificacionesHabilitadas) {
      await this.solicitarPermisos();
    }

    // Programar notificación diaria a la hora especificada
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
            title: '📊 Resumen del Día',
            body: 'Revisa tu actividad financiera de hoy',
            id: 999, // ID fijo para el resumen diario
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
      console.log('✅ Resumen diario programado para las', hora + ':00');
    } catch (error) {
      console.error('❌ Error programando resumen diario:', error);
    }
  }

  async cancelarResumenDiario(): Promise<void> {
    if (!this.platform.is('capacitor')) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id: 999 }] });
      console.log('✅ Resumen diario cancelado');
    } catch (error) {
      console.error('❌ Error cancelando resumen diario:', error);
    }
  }

  // ========== LIMPIAR NOTIFICACIONES ==========
  async limpiarTodasNotificaciones(): Promise<void> {
    if (!this.platform.is('capacitor')) return;

    try {
      await LocalNotifications.removeAllDeliveredNotifications();
      console.log('✅ Todas las notificaciones limpiadas');
    } catch (error) {
      console.error('❌ Error limpiando notificaciones:', error);
    }
  }

  // ========== VERIFICAR ESTADO ==========
  async estanHabilitadas(): Promise<boolean> {
    if (!this.platform.is('capacitor')) {
      return 'Notification' in window && Notification.permission === 'granted';
    }

    try {
      const permiso = await LocalNotifications.checkPermissions();
      const habilitadas = permiso.display === 'granted';
      console.log('📊 Estado de permisos:', habilitadas ? 'Habilitados ✅' : 'No habilitados ❌');
      return habilitadas;
    } catch (error) {
      console.error('❌ Error verificando permisos:', error);
      return false;
    }
  }
}