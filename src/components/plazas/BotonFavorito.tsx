import React, { useState } from 'react';
import { useFavoritos } from '../../context/useFavoritos';
import { useAuth } from '../../context/useAuth';

interface Props {
  plazaId: number;
  tamano?: 'sm' | 'md' | 'lg';
  mostrarTexto?: boolean;
  onRequiereLogin?: () => void;
}

export const BotonFavorito: React.FC<Props> = ({
  plazaId,
  tamano = 'md',
  mostrarTexto = false,
  onRequiereLogin,
}) => {
  const { autenticado } = useAuth();
  const { esFavorito, alternar } = useFavoritos();
  const [animando, setAnimando] = useState<boolean>(false);
  const [mensajeAviso, setMensajeAviso] = useState<string | null>(null);

  const fav = esFavorito(plazaId);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (!autenticado) {
      if (onRequiereLogin) {
        onRequiereLogin();
      } else {
        setMensajeAviso('Inicia sesión para guardar favoritos');
        setTimeout(() => setMensajeAviso(null), 3000);
      }
      return;
    }

    setAnimando(true);
    setTimeout(() => setAnimando(false), 350);

    try {
      await alternar(plazaId);
    } catch {
      // Manejado en el contexto
    }
  };

  return (
    <div className="boton-favorito-contenedor" style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={handleClick}
        className={`btn-favorito btn-favorito-${tamano} ${fav ? 'favorito-activo' : ''} ${animando ? 'favorito-animando' : ''}`}
        aria-label={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        title={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="icono-corazon"
          aria-hidden="true"
        >
          {fav ? (
            <path
              fill="currentColor"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          ) : (
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          )}
        </svg>
        {mostrarTexto && (
          <span className="texto-favorito">
            {fav ? 'Guardada en favoritos' : 'Guardar en favoritos'}
          </span>
        )}
      </button>

      {mensajeAviso && (
        <div className="tooltip-favorito-aviso" role="alert">
          {mensajeAviso}
        </div>
      )}
    </div>
  );
};

