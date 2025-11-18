// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Usuario, ConfiguracionUsuario, CONFIGURACION_DEFAULT } from '../models/usuario';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USUARIOS_KEY = 'usuarios';
  private readonly USUARIO_ACTUAL_KEY = 'usuario_actual';
  private readonly SESION_KEY = 'sesion_activa';
  private readonly CONFIG_KEY = 'configuracion_usuario';

  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(null);
  public usuarioActual$: Observable<Usuario | null> = this.usuarioActualSubject.asObservable();

  private autenticadoSubject = new BehaviorSubject<boolean>(false);
  public autenticado$: Observable<boolean> = this.autenticadoSubject.asObservable();

  constructor(
    private storage: StorageService,
    private router: Router
  ) {
    this.verificarSesion();
  }

  // ========== VERIFICACIÓN DE SESIÓN ==========
  private async verificarSesion(): Promise<void> {
    const sesionActiva = await this.storage.get(this.SESION_KEY);
    if (sesionActiva) {
      const usuarioId = await this.storage.get(this.USUARIO_ACTUAL_KEY);
      if (usuarioId) {
        const usuario = await this.obtenerUsuarioPorId(usuarioId);
        if (usuario) {
          this.usuarioActualSubject.next(usuario);
          this.autenticadoSubject.next(true);
        }
      }
    }
  }

  // ========== REGISTRO ==========
  async registrar(datos: Omit<Usuario, 'id' | 'createdAt'>): Promise<{ exito: boolean, mensaje: string, usuario?: Usuario }> {
    // Verificar si el email ya existe
    const usuarios = await this.obtenerTodosUsuarios();
    const emailExiste = usuarios.some(u => u.email === datos.email);

    if (emailExiste) {
      return { exito: false, mensaje: 'El email ya está registrado' };
    }

    // Crear nuevo usuario
    const nuevoUsuario: Usuario = {
      ...datos,
      id: this.generateId(),
      password: await this.hashPassword(datos.password),
      createdAt: new Date()
    };

    // Guardar usuario
    usuarios.push(nuevoUsuario);
    await this.storage.set(this.USUARIOS_KEY, usuarios);

    // Crear configuración por defecto
    await this.storage.set(`${this.CONFIG_KEY}_${nuevoUsuario.id}`, CONFIGURACION_DEFAULT);

    return { 
      exito: true, 
      mensaje: 'Usuario registrado exitosamente', 
      usuario: nuevoUsuario 
    };
  }

  // ========== LOGIN ==========
  async login(email: string, password: string): Promise<{ exito: boolean, mensaje: string }> {
    const usuarios = await this.obtenerTodosUsuarios();
    const usuario = usuarios.find(u => u.email === email);

    if (!usuario) {
      return { exito: false, mensaje: 'Usuario no encontrado' };
    }

    const passwordValida = await this.verificarPassword(password, usuario.password);

    if (!passwordValida) {
      return { exito: false, mensaje: 'Contraseña incorrecta' };
    }

    // Iniciar sesión
    await this.storage.set(this.SESION_KEY, true);
    await this.storage.set(this.USUARIO_ACTUAL_KEY, usuario.id);
    
    this.usuarioActualSubject.next(usuario);
    this.autenticadoSubject.next(true);

    return { exito: true, mensaje: 'Inicio de sesión exitoso' };
  }

  // ========== LOGOUT ==========
  async logout(): Promise<void> {
    await this.storage.remove(this.SESION_KEY);
    await this.storage.remove(this.USUARIO_ACTUAL_KEY);
    
    this.usuarioActualSubject.next(null);
    this.autenticadoSubject.next(false);
    
    this.router.navigate(['/login']);
  }

  // ========== OBTENER USUARIOS ==========
  private async obtenerTodosUsuarios(): Promise<Usuario[]> {
    const usuarios = await this.storage.get(this.USUARIOS_KEY);
    return usuarios || [];
  }

  private async obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
    const usuarios = await this.obtenerTodosUsuarios();
    return usuarios.find(u => u.id === id) || null;
  }

  async obtenerUsuarioActual(): Promise<Usuario | null> {
    return this.usuarioActualSubject.value;
  }

  // ========== ACTUALIZAR PERFIL ==========
  async actualizarPerfil(datos: Partial<Usuario>): Promise<{ exito: boolean, mensaje: string }> {
    const usuarioActual = await this.obtenerUsuarioActual();
    if (!usuarioActual) {
      return { exito: false, mensaje: 'No hay sesión activa' };
    }

    const usuarios = await this.obtenerTodosUsuarios();
    const index = usuarios.findIndex(u => u.id === usuarioActual.id);

    if (index === -1) {
      return { exito: false, mensaje: 'Usuario no encontrado' };
    }

    // Actualizar usuario
    const usuarioActualizado: Usuario = {
      ...usuarioActual,
      ...datos,
      id: usuarioActual.id,
      password: usuarioActual.password // No actualizar password aquí
    };

    usuarios[index] = usuarioActualizado;
    await this.storage.set(this.USUARIOS_KEY, usuarios);
    
    this.usuarioActualSubject.next(usuarioActualizado);

    return { exito: true, mensaje: 'Perfil actualizado exitosamente' };
  }

  // ========== CAMBIAR CONTRASEÑA ==========
  async cambiarPassword(passwordActual: string, nuevaPassword: string): Promise<{ exito: boolean, mensaje: string }> {
    const usuarioActual = await this.obtenerUsuarioActual();
    if (!usuarioActual) {
      return { exito: false, mensaje: 'No hay sesión activa' };
    }

    const passwordValida = await this.verificarPassword(passwordActual, usuarioActual.password);
    if (!passwordValida) {
      return { exito: false, mensaje: 'Contraseña actual incorrecta' };
    }

    const usuarios = await this.obtenerTodosUsuarios();
    const index = usuarios.findIndex(u => u.id === usuarioActual.id);

    if (index === -1) {
      return { exito: false, mensaje: 'Usuario no encontrado' };
    }

    usuarios[index].password = await this.hashPassword(nuevaPassword);
    await this.storage.set(this.USUARIOS_KEY, usuarios);

    return { exito: true, mensaje: 'Contraseña actualizada exitosamente' };
  }

  // ========== CONFIGURACIÓN DE USUARIO ==========
  async obtenerConfiguracion(): Promise<ConfiguracionUsuario> {
    const usuarioActual = await this.obtenerUsuarioActual();
    if (!usuarioActual) {
      return CONFIGURACION_DEFAULT;
    }

    const config = await this.storage.get(`${this.CONFIG_KEY}_${usuarioActual.id}`);
    return config || CONFIGURACION_DEFAULT;
  }

  async actualizarConfiguracion(config: Partial<ConfiguracionUsuario>): Promise<boolean> {
    const usuarioActual = await this.obtenerUsuarioActual();
    if (!usuarioActual) return false;

    const configActual = await this.obtenerConfiguracion();
    const configActualizada = { ...configActual, ...config };

    await this.storage.set(`${this.CONFIG_KEY}_${usuarioActual.id}`, configActualizada);
    return true;
  }

  // ========== VERIFICACIÓN DE ESTADO ==========
  async estaAutenticado(): Promise<boolean> {
    return this.autenticadoSubject.value;
  }

  // ========== UTILIDADES DE PASSWORD ==========
  private async hashPassword(password: string): Promise<string> {
    // En producción, usar bcrypt o similar
    // Por simplicidad, usamos btoa (NO SEGURO EN PRODUCCIÓN)
    return btoa(password);
  }

  private async verificarPassword(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ========== RESETEAR DATOS (Para testing) ==========
  async eliminarCuenta(): Promise<void> {
    const usuarioActual = await this.obtenerUsuarioActual();
    if (!usuarioActual) return;

    const usuarios = await this.obtenerTodosUsuarios();
    const usuariosFiltrados = usuarios.filter(u => u.id !== usuarioActual.id);
    
    await this.storage.set(this.USUARIOS_KEY, usuariosFiltrados);
    await this.storage.remove(`${this.CONFIG_KEY}_${usuarioActual.id}`);
    await this.logout();
  }
}