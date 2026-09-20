export interface DatosRegistro {
  nombre: string;
  correo: string;
  contrasena: string;
}

export interface CredencialesLogin {
  correo: string;
  contrasena: string;
}

export interface UsuarioAutenticado {
  id: number;
  nombre: string;
  correo: string;
}

export interface RespuestaLogin {
  token: string;
  usuario: UsuarioAutenticado;
}
