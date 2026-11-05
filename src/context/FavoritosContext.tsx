import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { FavoritosContext } from './favoritos-context';
import type { ContextoFavoritosValor } from './favoritos-context';
import { useAuth } from './useAuth';
import {
  obtenerIdsFavoritos,
  alternarFavorito as alternarFavoritoApi,
} from '../services/favoritos.service';

export const FavoritosProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { autenticado } = useAuth();
  const [favoritosIds, setFavoritosIds] = useState<Set<number>>(new Set());
  const [cargandoFavoritos, setCargandoFavoritos] = useState<boolean>(false);

  const cargarIds = useCallback(async () => {
    if (!autenticado) {
      setFavoritosIds(new Set());
      return;
    }

    try {
      setCargandoFavoritos(true);
      const ids = await obtenerIdsFavoritos();
      setFavoritosIds(new Set(ids));
    } catch {
      // Ignorar fallo de red o no autorizado
    } finally {
      setCargandoFavoritos(false);
    }
  }, [autenticado]);

  useEffect(() => {
    void cargarIds();
  }, [cargarIds]);

  const esFavorito = useCallback(
    (plazaId: number) => favoritosIds.has(plazaId),
    [favoritosIds],
  );

  const alternar = useCallback(
    async (plazaId: number): Promise<{ esFavorito: boolean; mensaje: string }> => {
      if (!autenticado) {
        return {
          esFavorito: false,
          mensaje: 'Inicia sesión o regístrate para guardar plazas en tus favoritos.',
        };
      }

      const eraFavorito = favoritosIds.has(plazaId);
      // Actualización optimista inmediata en la interfaz
      setFavoritosIds((prev) => {
        const siguiente = new Set(prev);
        if (eraFavorito) {
          siguiente.delete(plazaId);
        } else {
          siguiente.add(plazaId);
        }
        return siguiente;
      });

      try {
        const respuesta = await alternarFavoritoApi(plazaId);
        // Sincronizar con el estado devuelto por el backend
        setFavoritosIds((prev) => {
          const siguiente = new Set(prev);
          if (respuesta.esFavorito) {
            siguiente.add(plazaId);
          } else {
            siguiente.delete(plazaId);
          }
          return siguiente;
        });
        return respuesta;
      } catch (err: unknown) {
        // Revertir al estado anterior si falla la petición
        setFavoritosIds((prev) => {
          const siguiente = new Set(prev);
          if (eraFavorito) {
            siguiente.add(plazaId);
          } else {
            siguiente.delete(plazaId);
          }
          return siguiente;
        });
        const msg =
          err instanceof Error
            ? err.message
            : 'Error al actualizar el favorito.';
        throw new Error(msg);
      }
    },
    [autenticado, favoritosIds],
  );

  const valor = useMemo<ContextoFavoritosValor>(
    () => ({
      favoritosIds,
      cargandoFavoritos,
      esFavorito,
      alternar,
      recargarFavoritos: cargarIds,
    }),
    [favoritosIds, cargandoFavoritos, esFavorito, alternar, cargarIds],
  );

  return (
    <FavoritosContext.Provider value={valor}>
      {children}
    </FavoritosContext.Provider>
  );
};
