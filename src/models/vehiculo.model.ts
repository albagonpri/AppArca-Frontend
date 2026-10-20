export type EtiquetaAmbiental = "CERO" | "ECO" | "C" | "B" | "SIN_DISTINTIVO";

export type TipoPropulsion =
  | "GASOLINA"
  | "DIESEL"
  | "HIBRIDO_NO_ENCHUFABLE"
  | "HIBRIDO_ENCHUFABLE"
  | "ELECTRICO_PURO"
  | "OTRO";

export interface VehiculoCatalogo {
  id: number;
  marca: string;
  modelo: string;
  generacion?: string | null;
  anyoInicio?: number | null;
  anyoFin?: number | null;
  carroceria?: string | null;
  version: string;
  tipoPropulsion: TipoPropulsion;
  combustibleDetalle?: string | null;
  potenciaCv?: number | null;
  esEnchufable: boolean;
  etiquetaDgtSugerida?: EtiquetaAmbiental | null;
  etiquetaDgtFiable: boolean;
  longitud?: number | null;
  anchura?: number | null;
  altura?: number | null;
  origen?: string;
}

export interface Vehiculo {
  id: number;
  usuarioId: number;
  marca?: string | null;
  modelo?: string | null;
  matricula: string;
  etiquetaAmbiental: EtiquetaAmbiental;
  anyo?: number | null;
  version?: string | null;
  tipoPropulsion?: TipoPropulsion | null;
  esEnchufable?: boolean;
  longitud?: number | null;
  anchura?: number | null;
  altura?: number | null;
  suspensionBaja: boolean;
  catalogoVehiculoId?: number | null;
  catalogoVehiculo?: VehiculoCatalogo | null;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface CrearVehiculoDto {
  matricula: string;
  etiquetaAmbiental: EtiquetaAmbiental;
  marca?: string;
  modelo?: string;
  anyo?: number;
  version?: string;
  tipoPropulsion?: TipoPropulsion;
  esEnchufable?: boolean;
  longitud?: number;
  anchura?: number;
  altura?: number;
  suspensionBaja?: boolean;
  catalogoVehiculoId?: number;
}

export interface ActualizarVehiculoDto {
  matricula?: string;
  etiquetaAmbiental?: EtiquetaAmbiental;
  marca?: string;
  modelo?: string;
  anyo?: number;
  version?: string;
  tipoPropulsion?: TipoPropulsion;
  esEnchufable?: boolean;
  longitud?: number;
  anchura?: number;
  altura?: number;
  suspensionBaja?: boolean;
  catalogoVehiculoId?: number;
}

export interface OpcionEtiqueta {
  valor: EtiquetaAmbiental;
  texto: string;
}

export const OPCIONES_ETIQUETA_AMBIENTAL: OpcionEtiqueta[] = [
  { valor: "CERO", texto: "0 Emisiones" },
  { valor: "ECO", texto: "ECO" },
  { valor: "C", texto: "C" },
  { valor: "B", texto: "B" },
  { valor: "SIN_DISTINTIVO", texto: "Sin distintivo" },
];

export interface OpcionPropulsion {
  valor: TipoPropulsion;
  texto: string;
}

export const OPCIONES_TIPO_PROPULSION: OpcionPropulsion[] = [
  { valor: "GASOLINA", texto: "Gasolina" },
  { valor: "DIESEL", texto: "Diésel" },
  { valor: "HIBRIDO_NO_ENCHUFABLE", texto: "Híbrido no enchufable (HEV/MHEV)" },
  { valor: "HIBRIDO_ENCHUFABLE", texto: "Híbrido enchufable (PHEV)" },
  { valor: "ELECTRICO_PURO", texto: "100% Eléctrico (BEV)" },
  { valor: "OTRO", texto: "Otro (GLP, GNC, Hidrógeno...)" },
];

export function obtenerTextoEtiqueta(etiqueta?: EtiquetaAmbiental | null): string {
  if (!etiqueta) return "";
  const opcion = OPCIONES_ETIQUETA_AMBIENTAL.find((o) => o.valor === etiqueta);
  return opcion ? opcion.texto : etiqueta;
}

export function obtenerTextoPropulsion(propulsion?: TipoPropulsion | null): string {
  if (!propulsion) return "";
  const opcion = OPCIONES_TIPO_PROPULSION.find((o) => o.valor === propulsion);
  return opcion ? opcion.texto : propulsion;
}
