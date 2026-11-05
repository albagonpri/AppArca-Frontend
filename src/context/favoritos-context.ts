import { createContext } from 'react';

export interface ContextoFavoritosValor {
  favoritosIds: Set<number>;
  cargandoFavoritos: boolean;
  esFavorito: (plazaId: number) => boolean;
  alternar: (plazaId: number) => Promise<{ esFavorito: boolean; mensaje: string }>;
  recargarFavoritos: () => Promise<void>;
}

export const FavoritosContext = createContext<ContextoFavoritosValor | undefined>(
  undefined,
);

