import { API_URL, manejarRespuesta } from './api';
import type { Usuario, CrearUsuarioDto } from '../models/usuario.model';
import type { Plaza } from '../models/plaza.model';
import type { Reserva } from '../models/reserva.model';

export async function obtenerUsuarios(): Promise<Usuario[]> {
  const respuesta = await fetch(`${API_URL}/usuarios`);
  return manejarRespuesta<Usuario[]>(respuesta);
}

export async function obtenerUsuarioPorId(id: number): Promise<Usuario> {
  const respuesta = await fetch(`${API_URL}/usuarios/${id}`);
  return manejarRespuesta<Usuario>(respuesta);
}

export async function obtenerPlazasUsuario(id: number): Promise<Plaza[]> {
  const respuesta = await fetch(`${API_URL}/usuarios/${id}/plazas`);
  return manejarRespuesta<Plaza[]>(respuesta);
}

export async function obtenerReservasUsuario(id: number): Promise<Reserva[]> {
  const respuesta = await fetch(`${API_URL}/usuarios/${id}/reservas`);
  return manejarRespuesta<Reserva[]>(respuesta);
}

export async function crearUsuario(datos: CrearUsuarioDto): Promise<Usuario> {
  const respuesta = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta<Usuario>(respuesta);
}
