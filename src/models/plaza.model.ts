import type { Horario } from './horario';
import type { Usuario } from "./usuario.model";

export type DificultadEntrada =
  | "RESALTO"
  | "ENTRADA_ESTRECHA"
  | "RAMPA_PRONUNCIADA"
  | "PENDIENTE_PRONUNCIADA"
  | "GIRO_CERRADO"
  | "ALTURA_LIMITADA"
  | "ANCHURA_LIMITADA"
  | "OBSTACULOS"
  | "MANIOBRA_REDUCIDA"
  | "SUELO_IRREGULAR"
  | "VEHICULOS_BAJOS"
  | "OTRA";

export interface OpcionDificultad {
  id: DificultadEntrada;
  nombre: string;
}

/** Motivos estándar de entrada difícil presentados en el formulario */
export const MOTIVOS_ENTRADA_DIFICIL: readonly OpcionDificultad[] = [
  { id: "ENTRADA_ESTRECHA", nombre: "Entrada estrecha" },
  { id: "RAMPA_PRONUNCIADA", nombre: "Rampa pronunciada" },
  { id: "GIRO_CERRADO", nombre: "Curvas cerradas" },
  { id: "MANIOBRA_REDUCIDA", nombre: "Maniobras complicadas" },
  { id: "ALTURA_LIMITADA", nombre: "Altura de acceso limitada" },
  { id: "OTRA", nombre: "Otro" },
] as const;

export const DIFICULTADES_ENTRADA_OPCIONES: readonly OpcionDificultad[] = [
  { id: "ENTRADA_ESTRECHA", nombre: "Entrada estrecha" },
  { id: "RAMPA_PRONUNCIADA", nombre: "Rampa pronunciada" },
  { id: "GIRO_CERRADO", nombre: "Curvas cerradas" },
  { id: "MANIOBRA_REDUCIDA", nombre: "Maniobras complicadas" },
  { id: "ALTURA_LIMITADA", nombre: "Altura de acceso limitada" },
  { id: "RESALTO", nombre: "Resalto o badén" },
  { id: "PENDIENTE_PRONUNCIADA", nombre: "Pendiente pronunciada" },
  { id: "ANCHURA_LIMITADA", nombre: "Anchura limitada" },
  { id: "OBSTACULOS", nombre: "Columnas u obstáculos en la entrada" },
  { id: "SUELO_IRREGULAR", nombre: "Suelo irregular" },
  { id: "VEHICULOS_BAJOS", nombre: "Acceso complicado para vehículos bajos" },
  { id: "OTRA", nombre: "Otro" },
] as const;

export const DIFICULTADES_ENTRADA_ETIQUETAS: Record<DificultadEntrada, string> = {
  ENTRADA_ESTRECHA: "Entrada estrecha",
  RAMPA_PRONUNCIADA: "Rampa pronunciada",
  GIRO_CERRADO: "Curvas cerradas",
  MANIOBRA_REDUCIDA: "Maniobras complicadas",
  ALTURA_LIMITADA: "Altura de acceso limitada",
  RESALTO: "Resalto o badén",
  PENDIENTE_PRONUNCIADA: "Pendiente pronunciada",
  ANCHURA_LIMITADA: "Anchura limitada",
  OBSTACULOS: "Columnas u obstáculos en la entrada",
  SUELO_IRREGULAR: "Suelo irregular",
  VEHICULOS_BAJOS: "Acceso complicado para vehículos bajos",
  OTRA: "Otro",
};

export function obtenerEtiquetaDificultad(dificultad: DificultadEntrada | string): string {
  return (
    DIFICULTADES_ENTRADA_ETIQUETAS[dificultad as DificultadEntrada] || dificultad
  );
}

export interface FotoPlaza {
  id: number;
  plazaId: number;
  url: string;
  orden: number;
  fechaCreacion?: string;
}

export interface Plaza {
  horario?: Horario | null;
  id: number;
  propietarioId: number;
  titulo: string;
  descripcion: string;
  direccion: string;
  poblacion?: string | null;
  numeroPlaza?: string | null;
  planta?: string | null;
  indicacionesAcceso?: string | null;
  latitud: number;
  longitud: number;
  precioHora: number;
  largo: number;
  ancho: number;
  entradaDificil: boolean;
  dificultadesEntrada?: DificultadEntrada[];
  descripcionEntrada?: string | null;
  tieneCamaras: boolean;
  estaCubierta: boolean;
  tieneCargadorElectrico: boolean;
  disponible: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  propietario?: Usuario;
  fotos?: FotoPlaza[];
}

export interface CrearPlazaDto {
  horario?: Horario;
  titulo: string;
  descripcion?: string;
  calle: string;
  numero: string;
  codigoPostal: string;
  ciudad: string;
  poblacion?: string;
  provincia?: string;
  numeroPlaza?: string;
  planta?: string;
  indicacionesAcceso?: string;
  /** Coordenadas confirmadas por el usuario en el mapa. Si se envían, el backend las prioriza sobre CartoCiudad. */
  latitud?: number;
  longitud?: number;
  precioHora: number;
  largo: number;
  ancho: number;
  entradaDificil: boolean;
  dificultadesEntrada?: DificultadEntrada[];
  descripcionEntrada?: string | null;
  tieneCamaras: boolean;
  estaCubierta: boolean;
  tieneCargadorElectrico: boolean;
  propietarioId?: number;
}

export interface ActualizarPlazaDto {
  horario?: Horario;
  titulo?: string;
  descripcion?: string;
  calle?: string;
  numero?: string;
  codigoPostal?: string;
  ciudad?: string;
  poblacion?: string;
  provincia?: string;
  numeroPlaza?: string;
  planta?: string;
  indicacionesAcceso?: string;
  /** Coordenadas confirmadas por el usuario en el mapa al modificar la dirección. */
  latitud?: number;
  longitud?: number;
  precioHora?: number;
  largo?: number;
  ancho?: number;
  entradaDificil?: boolean;
  dificultadesEntrada?: DificultadEntrada[];
  descripcionEntrada?: string | null;
  tieneCamaras?: boolean;
  estaCubierta?: boolean;
  tieneCargadorElectrico?: boolean;
  disponible?: boolean;
}

export interface MarcadorPlazaMapa {
  id: number;
  titulo: string;
  zona: string;
  latitud: number;
  longitud: number;
  precioHora: number;
  estaCubierta: boolean;
  tieneCargadorElectrico: boolean;
  tieneCamaras: boolean;
  entradaDificil: boolean;
}

export interface FiltrosPlazasConsulta {
  page?: number;
  limit?: number;
  q?: string;
  provincia?: string;
  municipio?: string;
  codigoPostal?: string;
  estaCubierta?: boolean;
  tieneCargadorElectrico?: boolean;
  tieneCamaras?: boolean;
  entradaDificil?: boolean;
  largoMin?: number;
  anchoMin?: number;
  precioMin?: number;
  precioMax?: number;
}
