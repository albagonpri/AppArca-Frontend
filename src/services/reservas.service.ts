import { API_URL, manejarRespuesta } from './api';
import { obtenerToken } from './auth.service';
import type { Reserva, CrearReservaDto } from '../models/reserva.model';
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
