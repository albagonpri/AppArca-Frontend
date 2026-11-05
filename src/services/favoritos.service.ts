import { API_URL, manejarRespuesta } from './api';
import { obtenerToken } from './auth.service';
import type { Plaza } from '../models/plaza.model';
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

export async function obtenerIdsFavoritos(): Promise<number[]> {
  const token = obtenerToken();
  if (!token) return [];
  const respuesta = await fetch(`${API_URL}/favoritos/ids`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<number[]>(respuesta);
}

export async function alternarFavorito(
  plazaId: number,
): Promise<{ esFavorito: boolean; mensaje: string }> {
  const respuesta = await fetch(`${API_URL}/favoritos/${plazaId}/toggle`, {
    method: 'POST',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<{ esFavorito: boolean; mensaje: string }>(respuesta);
}

export async function marcarFavorito(
  plazaId: number,
): Promise<{ esFavorito: boolean; mensaje: string }> {
  const respuesta = await fetch(`${API_URL}/favoritos/${plazaId}`, {
    method: 'POST',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<{ esFavorito: boolean; mensaje: string }>(respuesta);
}

export async function desmarcarFavorito(
  plazaId: number,
): Promise<{ esFavorito: boolean; mensaje: string }> {
  const respuesta = await fetch(`${API_URL}/favoritos/${plazaId}`, {
    method: 'DELETE',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<{ esFavorito: boolean; mensaje: string }>(respuesta);
}

export async function obtenerMisFavoritos(
  params?: ParametrosPaginacion,
): Promise<RespuestaPaginada<Plaza>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.append('page', params.page.toString());
  if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const respuesta = await fetch(`${API_URL}/favoritos${qs}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<RespuestaPaginada<Plaza>>(respuesta);
}

