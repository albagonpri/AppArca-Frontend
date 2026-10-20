import { API_URL, manejarRespuesta } from './api';
import { obtenerToken } from './auth.service';
import type { Usuario, CrearUsuarioDto } from '../models/usuario.model';
import type { Plaza } from '../models/plaza.model';
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

export async function obtenerUsuarios(
  params?: ParametrosPaginacion,
): Promise<RespuestaPaginada<Usuario>> {
  const qs = construirQueryPaginacion(params);
  const respuesta = await fetch(`${API_URL}/usuarios${qs}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<RespuestaPaginada<Usuario>>(respuesta);
}

export async function obtenerUsuarioPorId(id: number): Promise<Usuario> {
  const respuesta = await fetch(`${API_URL}/usuarios/${id}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<Usuario>(respuesta);
}

export async function obtenerPlazasUsuario(
  id: number,
  params?: ParametrosPaginacion,
): Promise<RespuestaPaginada<Plaza>> {
  const qs = construirQueryPaginacion(params);
  const respuesta = await fetch(`${API_URL}/usuarios/${id}/plazas${qs}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<RespuestaPaginada<Plaza>>(respuesta);
}

export async function obtenerReservasUsuario(
  id: number,
  params?: ParametrosPaginacion,
): Promise<RespuestaPaginada<Reserva>> {
  const qs = construirQueryPaginacion(params);
  const respuesta = await fetch(`${API_URL}/usuarios/${id}/reservas${qs}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<RespuestaPaginada<Reserva>>(respuesta);
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
