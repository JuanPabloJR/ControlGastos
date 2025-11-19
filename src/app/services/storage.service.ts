// src/app/services/storage.service.ts

import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storageReady: Promise<void>;
  private isInitialized = false;

  constructor(private storage: Storage) {
    console.log('🔧 StorageService constructor llamado');
    this.storageReady = this.init();
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Storage ya inicializado, omitiendo...');
      return;
    }

    console.log('🔄 Inicializando Storage...');
    try {
      await this.storage.create();
      this.isInitialized = true;
      console.log('✅ Storage inicializado correctamente');
      
      // Debug inicial
      const keys = await this.storage.keys();
      console.log(`📊 Storage contiene ${keys?.length || 0} claves`);
      
      if (keys && keys.length > 0) {
        console.log('🔑 Claves encontradas:', keys);
      }
    } catch (error) {
      console.error('❌ Error inicializando Storage:', error);
      throw error;
    }
  }

  // Métodos genéricos de almacenamiento
  public async set(key: string, value: any): Promise<any> {
    await this.storageReady;
    console.log(`💾 SET: ${key}`, typeof value === 'object' ? `[${value?.constructor?.name || 'Object'}]` : value);
    try {
      const result = await this.storage.set(key, value);
      console.log(`✅ SET exitoso: ${key}`);
      return result;
    } catch (error) {
      console.error(`❌ Error en SET(${key}):`, error);
      throw error;
    }
  }

  public async get(key: string): Promise<any> {
    await this.storageReady;
    try {
      const value = await this.storage.get(key);
      if (value !== null) {
        console.log(`📖 GET: ${key} ✅ encontrado`);
      } else {
        console.log(`📖 GET: ${key} ❌ no encontrado`);
      }
      return value;
    } catch (error) {
      console.error(`❌ Error en GET(${key}):`, error);
      return null;
    }
  }

  public async remove(key: string): Promise<any> {
    await this.storageReady;
    console.log(`🗑️ REMOVE: ${key}`);
    try {
      const result = await this.storage.remove(key);
      console.log(`✅ REMOVE exitoso: ${key}`);
      return result;
    } catch (error) {
      console.error(`❌ Error en REMOVE(${key}):`, error);
      throw error;
    }
  }

  public async clear(): Promise<void> {
    await this.storageReady;
    console.log('🧹 CLEAR: eliminando todos los datos');
    try {
      await this.storage.clear();
      console.log('✅ CLEAR exitoso');
    } catch (error) {
      console.error('❌ Error en CLEAR:', error);
      throw error;
    }
  }

  public async keys(): Promise<string[]> {
    await this.storageReady;
    try {
      const keys = await this.storage.keys() || [];
      console.log(`🔑 KEYS: ${keys.length} claves encontradas`);
      return keys;
    } catch (error) {
      console.error('❌ Error en KEYS:', error);
      return [];
    }
  }

  public async length(): Promise<number> {
    await this.storageReady;
    try {
      const len = await this.storage.length() || 0;
      console.log(`📊 LENGTH: ${len} elementos`);
      return len;
    } catch (error) {
      console.error('❌ Error en LENGTH:', error);
      return 0;
    }
  }

  // Métodos específicos para la app
  public async getAllByPrefix(prefix: string): Promise<any[]> {
    await this.storageReady;
    console.log(`🔍 getAllByPrefix: buscando con prefijo "${prefix}"`);
    
    try {
      const keys = await this.keys();
      const filteredKeys = keys.filter(key => key.startsWith(prefix));
      console.log(`📦 Claves que coinciden: ${filteredKeys.length}`, filteredKeys);
      
      if (filteredKeys.length === 0) {
        console.log(`⚠️ No se encontraron claves con prefijo "${prefix}"`);
        return [];
      }
      
      const promises = filteredKeys.map(key => this.get(key));
      const results = await Promise.all(promises);
      
      // Filtrar nulls
      const validResults = results.filter(r => r !== null);
      console.log(`✅ getAllByPrefix: ${validResults.length} elementos encontrados`);
      
      return validResults;
    } catch (error) {
      console.error(`❌ Error en getAllByPrefix(${prefix}):`, error);
      return [];
    }
  }

  public async removeByPrefix(prefix: string): Promise<void> {
    await this.storageReady;
    console.log(`🗑️ removeByPrefix: eliminando con prefijo "${prefix}"`);
    
    try {
      const keys = await this.keys();
      const filteredKeys = keys.filter(key => key.startsWith(prefix));
      console.log(`🗑️ Claves a eliminar: ${filteredKeys.length}`);
      
      const promises = filteredKeys.map(key => this.remove(key));
      await Promise.all(promises);
      console.log(`✅ removeByPrefix: ${filteredKeys.length} elementos eliminados`);
    } catch (error) {
      console.error(`❌ Error en removeByPrefix(${prefix}):`, error);
      throw error;
    }
  }

  // Backup y restore
  public async exportData(): Promise<string> {
    await this.storageReady;
    console.log('📤 Exportando datos...');
    
    try {
      const keys = await this.keys();
      const data: any = {};
      
      for (const key of keys) {
        data[key] = await this.get(key);
      }
      
      const jsonData = JSON.stringify(data, null, 2);
      console.log(`✅ Datos exportados: ${keys.length} claves`);
      return jsonData;
    } catch (error) {
      console.error('❌ Error exportando datos:', error);
      throw error;
    }
  }

  public async importData(jsonData: string): Promise<boolean> {
    await this.storageReady;
    console.log('📥 Importando datos...');
    
    try {
      const data = JSON.parse(jsonData);
      const keys = Object.keys(data);
      console.log(`📥 Importando ${keys.length} claves...`);
      
      for (const key in data) {
        await this.set(key, data[key]);
      }
      
      console.log('✅ Datos importados correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error importando datos:', error);
      return false;
    }
  }

  // Debug
  public async debug(): Promise<void> {
    await this.storageReady;
    console.log('🔍 ===== DEBUG STORAGE =====');
    console.log(`Inicializado: ${this.isInitialized}`);
    
    try {
      const keys = await this.keys();
      console.log(`Total de claves: ${keys.length}`);
      
      if (keys.length === 0) {
        console.log('⚠️ Storage está vacío');
      } else {
        for (const key of keys) {
          const value = await this.storage.get(key);
          console.log(`  ${key}:`, value);
        }
      }
    } catch (error) {
      console.error('❌ Error en debug:', error);
    }
    
    console.log('🔍 ===== FIN DEBUG =====');
  }
}