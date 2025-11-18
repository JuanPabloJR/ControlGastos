// src/app/services/storage.service.ts

import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storageReady: Promise<void>;

  constructor(private storage: Storage) {
    this.storageReady = this.init();
  }

  async init(): Promise<void> {
    await this.storage.create();
  }

  // Métodos genéricos de almacenamiento
  public async set(key: string, value: any): Promise<any> {
    await this.storageReady;
    return this.storage.set(key, value);
  }

  public async get(key: string): Promise<any> {
    await this.storageReady;
    return this.storage.get(key);
  }

  public async remove(key: string): Promise<any> {
    await this.storageReady;
    return this.storage.remove(key);
  }

  public async clear(): Promise<void> {
    await this.storageReady;
    return this.storage.clear();
  }

  public async keys(): Promise<string[]> {
    await this.storageReady;
    return await this.storage.keys() || [];
  }

  public async length(): Promise<number> {
    await this.storageReady;
    return await this.storage.length() || 0;
  }

  // Métodos específicos para la app
  public async getAllByPrefix(prefix: string): Promise<any[]> {
    await this.storageReady;
    const keys = await this.keys();
    const filteredKeys = keys.filter(key => key.startsWith(prefix));
    const promises = filteredKeys.map(key => this.get(key));
    return Promise.all(promises);
  }

  public async removeByPrefix(prefix: string): Promise<void> {
    await this.storageReady;
    const keys = await this.keys();
    const filteredKeys = keys.filter(key => key.startsWith(prefix));
    const promises = filteredKeys.map(key => this.remove(key));
    await Promise.all(promises);
  }

  // Backup y restore
  public async exportData(): Promise<string> {
    await this.storageReady;
    const keys = await this.keys();
    const data: any = {};
    
    for (const key of keys) {
      data[key] = await this.get(key);
    }
    
    return JSON.stringify(data, null, 2);
  }

  public async importData(jsonData: string): Promise<boolean> {
    await this.storageReady;
    try {
      const data = JSON.parse(jsonData);
      
      for (const key in data) {
        await this.set(key, data[key]);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}