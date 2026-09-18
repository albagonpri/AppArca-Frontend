import type { Usuario } from './usuario.model';
import type { Plaza } from './plaza.model';

export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';

export interface Reserva {
  id: number;
  usuarioId: number;
  plazaId: number;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoReserva | string;
  fechaCreacion: string;
  fechaActualizacion: string;
  usuario?: Usuario;
  plaza?: Plaza;
}

export interface CrearReservaDto {
  usuarioId: number;
  plazaId: number;
  fechaInicio: string;
  fechaFin: string;
}
