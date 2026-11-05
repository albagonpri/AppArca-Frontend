import React, { useState } from 'react';
import type { FotoPlaza } from '../../models/plaza.model';
import { obtenerUrlFoto } from '../../services/plazas.service';

interface Props {
  fotos?: FotoPlaza[];
  tituloPlaza: string;
}

export const GaleriaFotosPlaza: React.FC<Props> = ({
  fotos = [],
  tituloPlaza,
}) => {
  const [indiceActual, setIndiceActual] = useState<number>(0);
  const total = fotos.length;

  if (total === 0) {
    return (
      <div className="plaza-galeria-vacia">
        <div className="plaza-galeria-placeholder">
          <span className="plaza-galeria-placeholder-icono" aria-hidden="true">
            🅿️
          </span>
          <p className="plaza-galeria-placeholder-texto">
            Sin fotografías disponibles
          </p>
          <span className="plaza-galeria-placeholder-sub">
            Plaza de aparcamiento en {tituloPlaza}
          </span>
        </div>
      </div>
    );
  }

  const fotoActual = fotos[indiceActual] || fotos[0];
  const urlFotoActual = obtenerUrlFoto(fotoActual.url);

  const irAnterior = () => {
    setIndiceActual((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const irSiguiente = () => {
    setIndiceActual((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  return (
    <div className="plaza-galeria-contenedor" aria-label={`Fotografías de ${tituloPlaza}`}>
      {/* Imagen Principal */}
      <div className="plaza-galeria-principal">
        <img
          src={urlFotoActual}
          alt={`Fotografía ${indiceActual + 1} de ${total} de ${tituloPlaza}`}
          className="plaza-galeria-imagen"
          loading="lazy"
        />

        {/* Indicador de número de foto */}
        <span className="plaza-galeria-contador">
          {indiceActual + 1} / {total}
        </span>

        {/* Controles de navegación */}
        {total > 1 && (
          <>
            <button
              type="button"
              className="plaza-galeria-nav plaza-galeria-nav-prev"
              onClick={irAnterior}
              aria-label="Fotografía anterior"
              title="Anterior"
            >
              &#10094;
            </button>
            <button
              type="button"
              className="plaza-galeria-nav plaza-galeria-nav-next"
              onClick={irSiguiente}
              aria-label="Fotografía siguiente"
              title="Siguiente"
            >
              &#10095;
            </button>
          </>
        )}
      </div>

      {/* Tira de miniaturas */}
      {total > 1 && (
        <div className="plaza-galeria-miniaturas">
          {fotos.map((foto, index) => {
            const urlMini = obtenerUrlFoto(foto.url);
            const estaActiva = index === indiceActual;
            return (
              <button
                key={foto.id || index}
                type="button"
                className={`plaza-miniatura-btn ${estaActiva ? 'activa' : ''}`}
                onClick={() => setIndiceActual(index)}
                aria-label={`Ver fotografía ${index + 1}`}
              >
                <img
                  src={urlMini}
                  alt={`Miniatura ${index + 1}`}
                  className="plaza-miniatura-img"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

