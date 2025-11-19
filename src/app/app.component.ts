// src/app/app.component.ts

import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Platform } from '@ionic/angular/standalone';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private storage: StorageService
  ) {
    console.log('🔧 AppComponent constructor');
    this.initializeApp();
  }

  async initializeApp() {
    console.log('🚀 Iniciando App...');
    
    try {
      // PASO 1: Esperar a que la plataforma esté lista
      await this.platform.ready();
      console.log('✅ Platform ready');
      console.log('📱 Plataformas:', this.platform.platforms());
      console.log('📱 ¿Es Capacitor?', this.platform.is('capacitor'));
      console.log('📱 ¿Es Android?', this.platform.is('android'));
      
      // PASO 2: Asegurar que Storage esté inicializado
      await this.storage.init();
      console.log('✅ Storage inicializado en AppComponent');
      
      // PASO 3: Debug en dispositivos móviles
      if (this.platform.is('capacitor')) {
        console.log('📱 === DEBUG DISPOSITIVO MÓVIL ===');
        
        const allKeys = await this.storage.keys();
        console.log(`📊 Total de claves: ${allKeys.length}`);
        
        if (allKeys.length > 0) {
          console.log('🔑 Claves encontradas:', allKeys);
          
          const gastosKeys = allKeys.filter(k => k.startsWith('gastos_'));
          const presupuestosKeys = allKeys.filter(k => k.startsWith('presupuestos_'));
          
          console.log(`💰 Gastos: ${gastosKeys.length}`);
          console.log(`📊 Presupuestos: ${presupuestosKeys.length}`);
          
          // Mostrar primeros 3 de cada uno
          if (gastosKeys.length > 0) {
            for (let i = 0; i < Math.min(3, gastosKeys.length); i++) {
              const gasto = await this.storage.get(gastosKeys[i]);
              console.log(`  Gasto ${i + 1}:`, gasto);
            }
          }
          
          if (presupuestosKeys.length > 0) {
            for (let i = 0; i < Math.min(3, presupuestosKeys.length); i++) {
              const presupuesto = await this.storage.get(presupuestosKeys[i]);
              console.log(`  Presupuesto ${i + 1}:`, presupuesto);
            }
          }
        } else {
          console.warn('⚠️ Storage vacío en dispositivo móvil');
          console.warn('⚠️ Los datos del navegador NO se sincronizan automáticamente');
          console.warn('⚠️ Debes crear datos nuevos en el dispositivo');
        }
        
        console.log('📱 === FIN DEBUG ===');
      }
      
    } catch (error) {
      console.error('❌ Error en initializeApp:', error);
    }
  }
}