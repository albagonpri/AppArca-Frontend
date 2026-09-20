import { createContext } from 'react';

export interface AuthContextType {
  autenticado: boolean;
  cargando: boolean;
  verificarSesion: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  autenticado: false,
  cargando: false,
  verificarSesion: async () => false,
});
