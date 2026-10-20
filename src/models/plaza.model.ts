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

export const DIFICULTADES_ENTRADA_OPCIONES: readonly OpcionDificultad[] = [
  { id: "RESALTO", nombre: "Resalto o badén" },
  { id: "ENTRADA_ESTRECHA", nombre: "Entrada estrecha" },
  { id: "RAMPA_PRONUNCIADA", nombre: "Rampa pronunciada" },
  { id: "PENDIENTE_PRONUNCIADA", nombre: "Pendiente pronunciada" },
  { id: "GIRO_CERRADO", nombre: "Giro cerrado" },
  { id: "ALTURA_LIMITADA", nombre: "Altura limitada" },
  { id: "ANCHURA_LIMITADA", nombre: "Anchura limitada" },
  { id: "OBSTACULOS", nombre: "Columnas u obstáculos en la entrada" },
  { id: "MANIOBRA_REDUCIDA", nombre: "Espacio reducido para maniobrar" },
  { id: "SUELO_IRREGULAR", nombre: "Suelo irregular" },
  { id: "VEHICULOS_BAJOS", nombre: "Acceso complicado para vehículos bajos" },
  { id: "OTRA", nombre: "Otra dificultad" },
] as const;

export const DIFICULTADES_ENTRADA_ETIQUETAS: Record<DificultadEntrada, string> = {
  RESALTO: "Resalto o badén",
  ENTRADA_ESTRECHA: "Entrada estrecha",
  RAMPA_PRONUNCIADA: "Rampa pronunciada",
  PENDIENTE_PRONUNCIADA: "Pendiente pronunciada",
  GIRO_CERRADO: "Giro cerrado",
  ALTURA_LIMITADA: "Altura limitada",
  ANCHURA_LIMITADA: "Anchura limitada",
  OBSTACULOS: "Columnas u obstáculos en la entrada",
  MANIOBRA_REDUCIDA: "Espacio reducido para maniobrar",
  SUELO_IRREGULAR: "Suelo irregular",
  VEHICULOS_BAJOS: "Acceso complicado para vehículos bajos",
  OTRA: "Otra dificultad",
};

export function obtenerEtiquetaDificultad(dificultad: DificultadEntrada | string): string {
  return (
    DIFICULTADES_ENTRADA_ETIQUETAS[dificultad as DificultadEntrada] || dificultad
  );
}

export interface Plaza {
  id: number;
  propietarioId: number;
  titulo: string;
  descripcion: string;
  direccion: string;
  latitud: number;
  longitud: number;
  precioHora: number;
  largo: number;
  ancho: number;
  entradaDificil: boolean;
  dificultadesEntrada?: DificultadEntrada[];
  descripcionEntrada?: string | null;
  tieneCamaras: boolean;
  disponible: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  propietario?: Usuario;
}

export interface CrearPlazaDto {
  titulo: string;
  descripcion?: string;
  calle: string;
  numero: string;
  codigoPostal: string;
  ciudad: string;
  provincia?: string;
  precioHora: number;
  largo: number;
  ancho: number;
  entradaDificil?: boolean;
  dificultadesEntrada?: DificultadEntrada[];
  descripcionEntrada?: string | null;
  tieneCamaras?: boolean;
  propietarioId?: number;
}

export interface ActualizarPlazaDto {
  titulo?: string;
  descripcion?: string;
  calle?: string;
  numero?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  precioHora?: number;
  largo?: number;
  ancho?: number;
  entradaDificil?: boolean;
  dificultadesEntrada?: DificultadEntrada[];
  descripcionEntrada?: string | null;
  tieneCamaras?: boolean;
  disponible?: boolean;
}
