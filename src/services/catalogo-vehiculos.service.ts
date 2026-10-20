import { API_URL, manejarRespuesta } from "./api";
import { obtenerToken } from "./auth.service";
import type { VehiculoCatalogo } from "../models/vehiculo.model";

function obtenerCabecerasAuth(): Record<string, string> {
  const token = obtenerToken();
  const cabeceras: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    cabeceras["Authorization"] = `Bearer ${token}`;
  }

  return cabeceras;
}

export async function buscarVehiculosCatalogo(
  q: string,
  limite = 15,
): Promise<VehiculoCatalogo[]> {
  const termino = q.trim();
  if (termino.length < 2) return [];

  const params = new URLSearchParams();
  params.append("q", termino);
  if (limite) params.append("limite", String(limite));

  const respuesta = await fetch(`${API_URL}/catalogo-vehiculos/buscar?${params.toString()}`, {
    method: "GET",
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<VehiculoCatalogo[]>(respuesta);
}

export async function obtenerMarcasCatalogo(): Promise<string[]> {
  const respuesta = await fetch(`${API_URL}/catalogo-vehiculos/marcas`, {
    method: "GET",
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<string[]>(respuesta);
}

export async function obtenerModelosCatalogo(marca: string): Promise<string[]> {
  const params = new URLSearchParams({ marca });
  const respuesta = await fetch(`${API_URL}/catalogo-vehiculos/modelos?${params.toString()}`, {
    method: "GET",
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<string[]>(respuesta);
}

export async function obtenerVersionesCatalogo(
  marca: string,
  modelo: string,
  anyo?: number,
): Promise<VehiculoCatalogo[]> {
  const params = new URLSearchParams({ marca, modelo });
  if (anyo) params.append("anyo", String(anyo));

  const respuesta = await fetch(`${API_URL}/catalogo-vehiculos/versiones?${params.toString()}`, {
    method: "GET",
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<VehiculoCatalogo[]>(respuesta);
}

export async function obtenerVehiculoCatalogoPorId(
  id: number,
): Promise<VehiculoCatalogo> {
  const respuesta = await fetch(`${API_URL}/catalogo-vehiculos/${id}`, {
    method: "GET",
    headers: obtenerCabecerasAuth(),
  });
  return manejarRespuesta<VehiculoCatalogo>(respuesta);
}
