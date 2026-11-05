import { API_URL, manejarRespuesta } from './api';
import { obtenerToken } from './auth.service';
import type {
  Plaza,
  FotoPlaza,
  CrearPlazaDto,
  ActualizarPlazaDto,
  FiltrosPlazasConsulta,
  MarcadorPlazaMapa,
} from '../models/plaza.model';
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

function construirQueryFiltrosPlazas(filtros?: FiltrosPlazasConsulta): string {
  if (!filtros) return '';
  const params = new URLSearchParams();

  if (filtros.page !== undefined) params.append('page', filtros.page.toString());
  if (filtros.limit !== undefined) params.append('limit', filtros.limit.toString());
  if (filtros.q && filtros.q.trim()) params.append('q', filtros.q.trim());
  if (filtros.provincia && filtros.provincia.trim()) params.append('provincia', filtros.provincia.trim());
  if (filtros.municipio && filtros.municipio.trim()) params.append('municipio', filtros.municipio.trim());
  if (filtros.codigoPostal && filtros.codigoPostal.trim()) params.append('codigoPostal', filtros.codigoPostal.trim());

  if (filtros.estaCubierta !== undefined) params.append('estaCubierta', String(filtros.estaCubierta));
  if (filtros.tieneCargadorElectrico !== undefined) params.append('tieneCargadorElectrico', String(filtros.tieneCargadorElectrico));
  if (filtros.tieneCamaras !== undefined) params.append('tieneCamaras', String(filtros.tieneCamaras));
  if (filtros.entradaDificil !== undefined) params.append('entradaDificil', String(filtros.entradaDificil));

  if (filtros.largoMin !== undefined && !isNaN(filtros.largoMin)) params.append('largoMin', filtros.largoMin.toString());
  if (filtros.anchoMin !== undefined && !isNaN(filtros.anchoMin)) params.append('anchoMin', filtros.anchoMin.toString());
  if (filtros.precioMin !== undefined && !isNaN(filtros.precioMin)) params.append('precioMin', filtros.precioMin.toString());
  if (filtros.precioMax !== undefined && !isNaN(filtros.precioMax)) params.append('precioMax', filtros.precioMax.toString());

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function obtenerPlazas(
  filtros?: FiltrosPlazasConsulta,
): Promise<RespuestaPaginada<Plaza>> {
  const qs = construirQueryFiltrosPlazas(filtros);
  const respuesta = await fetch(`${API_URL}/plazas${qs}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<RespuestaPaginada<Plaza>>(respuesta);
}

export async function obtenerMarcadoresMapa(
  filtros?: FiltrosPlazasConsulta,
): Promise<MarcadorPlazaMapa[]> {
  const qs = construirQueryFiltrosPlazas(filtros);
  const respuesta = await fetch(`${API_URL}/plazas/mapa${qs}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<MarcadorPlazaMapa[]>(respuesta);
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
  const respuesta = await fetch(`${API_URL}/plazas/${id}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<Plaza>(respuesta);
}

export async function obtenerReservasPlaza(
  id: number,
  params?: ParametrosPaginacion,
): Promise<RespuestaPaginada<Reserva>> {
  const qs = construirQueryPaginacion(params);
  const respuesta = await fetch(`${API_URL}/plazas/${id}/reservas${qs}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
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

export function obtenerUrlFoto(urlRelativa: string): string {
  if (!urlRelativa) return '';
  if (urlRelativa.startsWith('http://') || urlRelativa.startsWith('https://')) {
    return urlRelativa;
  }
  return `${API_URL}${urlRelativa.startsWith('/') ? '' : '/'}${urlRelativa}`;
}

export async function subirFotosPlaza(
  plazaId: number,
  archivos: File[],
): Promise<FotoPlaza[]> {
  const formData = new FormData();
  for (const archivo of archivos) {
    formData.append('fotos', archivo);
  }

  const token = obtenerToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${API_URL}/plazas/${plazaId}/fotos`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return manejarRespuesta<FotoPlaza[]>(respuesta);
}

export async function eliminarFotoPlaza(
  plazaId: number,
  fotoId: number,
): Promise<{ mensaje: string }> {
  const respuesta = await fetch(`${API_URL}/plazas/${plazaId}/fotos/${fotoId}`, {
    method: 'DELETE',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<{ mensaje: string }>(respuesta);
}
