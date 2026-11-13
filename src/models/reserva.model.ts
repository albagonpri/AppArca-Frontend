import type { Usuario } from './usuario.model';
import type { Plaza } from './plaza.model';
import type { Vehiculo } from './vehiculo.model';

export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';

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
}
