import type { Usuario } from './usuario.model';
import type { Plaza } from './plaza.model';
import type { Vehiculo } from './vehiculo.model';

export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'RECHAZADA';

export function formatearEstadoReserva(estado: string): string {
  switch (estado?.toUpperCase()) {
    case 'PENDIENTE':
      return 'Pendiente de respuesta';
    case 'CONFIRMADA':
      return 'Confirmada';
    case 'RECHAZADA':
      return 'Rechazada';
    case 'CANCELADA':
      return 'Cancelada';
    case 'COMPLETADA':
      return 'Completada';
    default:
      return estado || '—';
  }
}

export function obtenerClaseBadgeEstado(estado: string): string {
  switch (estado?.toUpperCase()) {
    case 'CONFIRMADA':
    case 'COMPLETADA':
      return 'badge badge-success';
    case 'PENDIENTE':
      return 'badge badge-warning';
    case 'RECHAZADA':
    case 'CANCELADA':
      return 'badge badge-danger';
    default:
      return 'badge badge-neutral';
  }
}

export interface Reserva {
  id: number;
  usuarioId: number;
  plazaId: number;
  vehiculoId?: number | null;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoReserva | string;
  precioTotal?: number | string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  usuario?: Usuario;
  plaza?: Plaza;
  vehiculo?: Vehiculo | null;
}

export interface CrearReservaDto {
  usuarioId: number;
  plazaId: number;
  vehiculoId?: number;
  fechaInicio: string;
  fechaFin: string;
  precioTotal?: number;
}
