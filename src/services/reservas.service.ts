import { API_URL, manejarRespuesta } from './api';
import { obtenerToken } from './auth.service';
import type { Reserva, CrearReservaDto, EstadoReserva } from '../models/reserva.model';
import type { ParametrosPaginacion, RespuestaPaginada } from '../models/paginacion.model';

function obtenerCabecerasAuth(): Record<string, string> {
  const token = obtenerToken();
  const cabeceras: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    cabeceras['Authorization'] = `Bearer ${token}`;
  }

  return cabeceras;
}

export interface FiltrosReservas extends ParametrosPaginacion {
  tipo?: 'propias' | 'recibidas';
  estado?: string;
}

function construirQueryReservas(params?: FiltrosReservas): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.append('page', params.page.toString());
  if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
  if (params.tipo !== undefined) searchParams.append('tipo', params.tipo);
  if (params.estado !== undefined) searchParams.append('estado', params.estado);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export async function obtenerReservas(
  params?: FiltrosReservas,
): Promise<RespuestaPaginada<Reserva>> {
  const qs = construirQueryReservas(params);
  const respuesta = await fetch(`${API_URL}/reservas${qs}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<RespuestaPaginada<Reserva>>(respuesta);
}

export async function obtenerReservaPorId(id: number): Promise<Reserva> {
  const respuesta = await fetch(`${API_URL}/reservas/${id}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<Reserva>(respuesta);
}

export async function crearReserva(datos: CrearReservaDto): Promise<Reserva> {
  const respuesta = await fetch(`${API_URL}/reservas`, {
    method: 'POST',
    headers: obtenerCabecerasAuth(),
    body: JSON.stringify(datos),
  });
  return manejarRespuesta<Reserva>(respuesta);
}

export async function consultarDisponibilidad(id:number, inicio:string, fin:string, signal:AbortSignal) {
  const query = new URLSearchParams({inicio,fin});
  const respuesta = await fetch(`${API_URL}/reservas/disponibilidad/${id}?${query}`, {
    headers: obtenerCabecerasAuth(), cache:'no-store', signal,
  });
  return manejarRespuesta<{disponible:boolean}>(respuesta);
}

export async function actualizarEstadoReserva(
  id: number,
  estado: EstadoReserva,
  motivoRechazo?: string,
): Promise<Reserva> {
  const respuesta = await fetch(`${API_URL}/reservas/${id}`, {
    method: 'PATCH',
    headers: obtenerCabecerasAuth(),
    body: JSON.stringify({ estado, motivoRechazo }),
  });
  return manejarRespuesta<Reserva>(respuesta);
}

export async function consultarFranjas(id: number, fecha: string, signal: AbortSignal) {
  const respuesta = await fetch(`${API_URL}/reservas/franjas/${id}?fecha=${encodeURIComponent(fecha)}`, {
    headers: obtenerCabecerasAuth(), signal, cache: 'no-store',
  });
  return manejarRespuesta<{inicio: number; fin: number; estado?: EstadoReserva}[]>(respuesta);
}
