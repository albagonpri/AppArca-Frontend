import { API_URL, manejarRespuesta } from './api';
import { obtenerToken } from './auth.service';
import type { Plaza, CrearPlazaDto, ActualizarPlazaDto } from '../models/plaza.model';
import type { Reserva } from '../models/reserva.model';
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

function construirQueryPaginacion(params?: ParametrosPaginacion): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.append('page', params.page.toString());
  if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export async function obtenerPlazas(
  params?: ParametrosPaginacion,
): Promise<RespuestaPaginada<Plaza>> {
  const qs = construirQueryPaginacion(params);
  const respuesta = await fetch(`${API_URL}/plazas${qs}`);
  return manejarRespuesta<RespuestaPaginada<Plaza>>(respuesta);
}

export async function obtenerMisPlazas(
  params?: ParametrosPaginacion,
): Promise<RespuestaPaginada<Plaza>> {
  const qs = construirQueryPaginacion(params);
  const respuesta = await fetch(`${API_URL}/plazas/mis-plazas${qs}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<RespuestaPaginada<Plaza>>(respuesta);
}

export async function obtenerPlazaPorId(id: number): Promise<Plaza> {
  const respuesta = await fetch(`${API_URL}/plazas/${id}`);
  return manejarRespuesta<Plaza>(respuesta);
}

export async function obtenerReservasPlaza(
  id: number,
  params?: ParametrosPaginacion,
): Promise<RespuestaPaginada<Reserva>> {
  const qs = construirQueryPaginacion(params);
  const respuesta = await fetch(`${API_URL}/plazas/${id}/reservas${qs}`);
  return manejarRespuesta<RespuestaPaginada<Reserva>>(respuesta);
}

export async function crearPlaza(datos: CrearPlazaDto): Promise<Plaza> {
  const respuesta = await fetch(`${API_URL}/plazas`, {
    method: 'POST',
    headers: obtenerCabecerasAuth(),
    body: JSON.stringify(datos),
  });
  return manejarRespuesta<Plaza>(respuesta);
}

export async function actualizarPlaza(
  id: number,
  datos: ActualizarPlazaDto,
): Promise<Plaza> {
  const respuesta = await fetch(`${API_URL}/plazas/${id}`, {
    method: 'PATCH',
    headers: obtenerCabecerasAuth(),
    body: JSON.stringify(datos),
  });
  return manejarRespuesta<Plaza>(respuesta);
}

export async function eliminarPlaza(id: number): Promise<Plaza> {
  const respuesta = await fetch(`${API_URL}/plazas/${id}`, {
    method: 'DELETE',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<Plaza>(respuesta);
}
