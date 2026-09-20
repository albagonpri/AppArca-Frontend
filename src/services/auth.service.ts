import { API_URL, manejarRespuesta } from './api';
import type { DatosRegistro, CredencialesLogin, RespuestaLogin, UsuarioAutenticado } from '../models/auth.model';
import type { Usuario } from '../models/usuario.model';

const TOKEN_KEY = 'apparca_token';
const USUARIO_KEY = 'apparca_usuario';

/**
 * Notifica a los componentes suscritos que el estado de autenticación ha cambiado.
 */
export function notificarCambioAuth(): void {
  window.dispatchEvent(new Event('apparca_auth_change'));
}

/**
 * Guarda el token JWT en localStorage.
 */
export function guardarToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  notificarCambioAuth();
}

/**
 * Obtiene el token JWT almacenado en localStorage.
 */
export function obtenerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Elimina el token JWT de localStorage.
 */
export function eliminarToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
  notificarCambioAuth();
}

/**
 * Guarda los datos básicos del usuario autenticado en localStorage (únicamente id, nombre y correo; sin fechas).
 */
export function guardarUsuarioSesion(usuario: Partial<UsuarioAutenticado>): void {
  const datosSesion: UsuarioAutenticado = {
    id: usuario.id ?? 0,
    nombre: usuario.nombre ?? '',
    correo: usuario.correo ?? '',
  };
  localStorage.setItem(USUARIO_KEY, JSON.stringify(datosSesion));
}

/**
 * Obtiene los datos básicos del usuario autenticado almacenados.
 */
export function obtenerUsuarioSesion(): UsuarioAutenticado | null {
  const usuarioRaw = localStorage.getItem(USUARIO_KEY);
  if (!usuarioRaw) return null;
  try {
    return JSON.parse(usuarioRaw) as UsuarioAutenticado;
  } catch {
    return null;
  }
}

/**
 * Valida la sesión actual en el backend mediante GET /auth/perfil con Bearer token.
 * Si no hay token, si está expirado o si el backend responde 401/error:
 * elimina el token de localStorage y retorna false.
 */
export async function validarSesion(): Promise<boolean> {
  const token = obtenerToken();
  if (!token) {
    return false;
  }

  // Comprobación local previa de formato y expiración como optimización
  try {
    const partes = token.split('.');
    if (partes.length === 3) {
      const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      if (payload.exp && typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
        eliminarToken();
        return false;
      }
    } else {
      eliminarToken();
      return false;
    }
  } catch {
    eliminarToken();
    return false;
  }

  // Validación definitiva de la firma y validez con el backend
  try {
    const respuesta = await fetch(`${API_URL}/auth/perfil`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!respuesta.ok) {
      eliminarToken();
      return false;
    }

    const usuario = await respuesta.json();
    guardarUsuarioSesion(usuario);
    return true;
  } catch {
    // Si el backend no responde o hay fallo de red, se mantiene el estado sin validar
    return false;
  }
}

/**
 * Registra un nuevo usuario en el backend (POST /auth/registro).
 */
export async function registrar(datos: DatosRegistro): Promise<Usuario> {
  const respuesta = await fetch(`${API_URL}/auth/registro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });

  return manejarRespuesta<Usuario>(respuesta);
}

/**
 * Inicia sesión en el backend (POST /auth/login).
 */
export async function iniciarSesion(datos: CredencialesLogin): Promise<RespuestaLogin> {
  const respuesta = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });

  return manejarRespuesta<RespuestaLogin>(respuesta);
}

/**
 * Obtiene los datos del perfil del usuario autenticado (GET /auth/perfil).
 */
export async function obtenerPerfil(): Promise<Usuario> {
  const token = obtenerToken();
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const respuesta = await fetch(`${API_URL}/auth/perfil`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return manejarRespuesta<Usuario>(respuesta);
}

