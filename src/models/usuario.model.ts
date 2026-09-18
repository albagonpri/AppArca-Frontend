export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CrearUsuarioDto {
  nombre: string;
  correo: string;
}
