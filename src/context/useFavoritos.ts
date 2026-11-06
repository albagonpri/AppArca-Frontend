import { useContext } from 'react';
import { FavoritosContext } from './favoritos-context';
export type { ContextoFavoritosValor } from './favoritos-context';

export function useFavoritos() {
  const context = useContext(FavoritosContext);
  if (!context) {
    throw new Error('useFavoritos debe utilizarse dentro de un FavoritosProvider');
  }
  return context;
}
