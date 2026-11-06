import { API_URL, manejarRespuesta } from './api';
import { obtenerToken } from './auth.service';

export interface CandidatoGeocodificacion {
  id: string;
  direccionCompleta: string;
  calle?: string;
  numero?: string;
  codigoPostal?: string;
  municipio?: string;
  provincia?: string;
  latitud: number;
  longitud: number;
  tipo: string;
  fuente: string;
}

export interface BuscarDireccionParams {
  calle: string;
  numero?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  poblacion?: string;
}

function obtenerCabecerasAuth(): Record<string, string> {
  const token = obtenerToken();
  const cabeceras: Record<string, string> = {};
  if (token) {
    cabeceras['Authorization'] = `Bearer ${token}`;
  }
  return cabeceras;
}

/**
 * Consulta el endpoint GET /geocodificacion/buscar del backend.
 * Toda la lógica de CartoCiudad permanece en el backend (geocoding.service.ts).
 */
export async function buscarDireccion(
  params: BuscarDireccionParams,
): Promise<CandidatoGeocodificacion[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('calle', params.calle.trim());
  if (params.numero?.trim()) searchParams.set('numero', params.numero.trim());
  if (params.codigoPostal?.trim()) searchParams.set('codigoPostal', params.codigoPostal.trim());
  if (params.ciudad?.trim()) searchParams.set('ciudad', params.ciudad.trim());
  if (params.provincia?.trim()) searchParams.set('provincia', params.provincia.trim());
  if (params.poblacion?.trim()) searchParams.set('poblacion', params.poblacion.trim());

  const respuesta = await fetch(
    `${API_URL}/geocodificacion/buscar?${searchParams.toString()}`,
    { headers: obtenerCabecerasAuth() },
  );

  return manejarRespuesta<CandidatoGeocodificacion[]>(respuesta);
}

export interface ResultadoCodigoPostal {
  codigoPostal: string;
  provincia: string;
  municipio: string;
  poblaciones: string[];
  poblacionSugerida: string;
}

/**
 * Consulta el endpoint GET /geocodificacion/codigo-postal/:cp del backend
 * para autocompletar provincia, municipio y poblaciones asociadas a un código postal español.
 */
export async function consultarCodigoPostal(
  cp: string,
  signal?: AbortSignal,
): Promise<ResultadoCodigoPostal> {
  const respuesta = await fetch(
    `${API_URL}/geocodificacion/codigo-postal/${encodeURIComponent(cp.trim())}`,
    { headers: obtenerCabecerasAuth(), signal },
  );

  return manejarRespuesta<ResultadoCodigoPostal>(respuesta);
}

export async function direccionDelPunto(latitud: number, longitud: number) {
  const params = new URLSearchParams({ latitud: String(latitud), longitud: String(longitud) });
  const respuesta = await fetch(`${API_URL}/geocodificacion/inversa?${params}`, { headers: obtenerCabecerasAuth() });
  return manejarRespuesta<{
    calle: string; numero: string; codigoPostal: string; municipio: string; poblacion: string; provincia: string;
  }>(respuesta);
}
