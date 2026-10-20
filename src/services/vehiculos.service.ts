import { API_URL, manejarRespuesta } from './api';
import { obtenerToken } from './auth.service';
import type {
  Vehiculo,
  CrearVehiculoDto,
  ActualizarVehiculoDto,
} from '../models/vehiculo.model';
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

export async function obtenerVehiculos(
  params?: ParametrosPaginacion,
): Promise<RespuestaPaginada<Vehiculo>> {
  const qs = construirQueryPaginacion(params);
  const respuesta = await fetch(`${API_URL}/vehiculos${qs}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<RespuestaPaginada<Vehiculo>>(respuesta);
}

export async function obtenerVehiculoPorId(id: number): Promise<Vehiculo> {
  const respuesta = await fetch(`${API_URL}/vehiculos/${id}`, {
    method: 'GET',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<Vehiculo>(respuesta);
}

export async function crearVehiculo(datos: CrearVehiculoDto): Promise<Vehiculo> {
  const respuesta = await fetch(`${API_URL}/vehiculos`, {
    method: 'POST',
    headers: obtenerCabecerasAuth(),
    body: JSON.stringify(datos),
  });
  return manejarRespuesta<Vehiculo>(respuesta);
}

export async function actualizarVehiculo(
  id: number,
  datos: ActualizarVehiculoDto,
): Promise<Vehiculo> {
  const respuesta = await fetch(`${API_URL}/vehiculos/${id}`, {
    method: 'PATCH',
    headers: obtenerCabecerasAuth(),
    body: JSON.stringify(datos),
  });
  return manejarRespuesta<Vehiculo>(respuesta);
}

export async function eliminarVehiculo(id: number): Promise<Vehiculo> {
  const respuesta = await fetch(`${API_URL}/vehiculos/${id}`, {
    method: 'DELETE',
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<Vehiculo>(respuesta);
}
