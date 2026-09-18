import type { Usuario } from './usuario.model';

export interface Plaza {
  id: number;
  propietarioId: number;
  titulo: string;
  descripcion: string;
  direccion: string;
  latitud: number;
  longitud: number;
  precioHora: number;
  disponible: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  propietario?: Usuario;
}

export interface CrearPlazaDto {
  propietarioId: number;
  titulo: string;
  descripcion: string;
  direccion: string;
  latitud: number;
  longitud: number;
  precioHora: number;
}
