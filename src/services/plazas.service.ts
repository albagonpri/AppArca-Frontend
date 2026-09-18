import { API_URL, manejarRespuesta } from './api';
import type { Plaza, CrearPlazaDto } from '../models/plaza.model';
import type { Reserva } from '../models/reserva.model';

export async function obtenerPlazas(): Promise<Plaza[]> {
  const respuesta = await fetch(`${API_URL}/plazas`);
  return manejarRespuesta<Plaza[]>(respuesta);
}

export async function obtenerPlazaPorId(id: number): Promise<Plaza> {
  const respuesta = await fetch(`${API_URL}/plazas/${id}`);
  return manejarRespuesta<Plaza>(respuesta);
}

export async function obtenerReservasPlaza(id: number): Promise<Reserva[]> {
  const respuesta = await fetch(`${API_URL}/plazas/${id}/reservas`);
  return manejarRespuesta<Reserva[]>(respuesta);
}

export async function crearPlaza(datos: CrearPlazaDto): Promise<Plaza> {
  const respuesta = await fetch(`${API_URL}/plazas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta<Plaza>(respuesta);
}
