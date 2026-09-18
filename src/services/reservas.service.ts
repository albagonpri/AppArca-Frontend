import { API_URL, manejarRespuesta } from './api';
import type { Reserva, CrearReservaDto } from '../models/reserva.model';

export async function obtenerReservas(): Promise<Reserva[]> {
  const respuesta = await fetch(`${API_URL}/reservas`);
  return manejarRespuesta<Reserva[]>(respuesta);
}

export async function obtenerReservaPorId(id: number): Promise<Reserva> {
  const respuesta = await fetch(`${API_URL}/reservas/${id}`);
  return manejarRespuesta<Reserva>(respuesta);
}

export async function crearReserva(datos: CrearReservaDto): Promise<Reserva> {
  const respuesta = await fetch(`${API_URL}/reservas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta<Reserva>(respuesta);
}
