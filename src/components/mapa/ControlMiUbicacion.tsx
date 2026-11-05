import React from 'react';
import L from 'leaflet';

interface ControlMiUbicacionProps {
  cargando: boolean;
  activo: boolean;
  onSolicitarUbicacion: () => void;
  posicion?: 'topleft' | 'topright' | 'bottomright' | 'bottomleft';
}

/**
 * Botón interactivo de «Mi ubicación» para mapas de Leaflet.
 * - Icono de localización / crosshair moderno estilo Google Maps.
 * - Estado de carga visual mientras el navegador obtiene las coordenadas.
 * - Estado activo resaltado cuando el mapa está centrado en la posición del usuario.
 * - Previene la propagación de eventos al mapa para evitar zoom o clics accidentales.
 */
export const ControlMiUbicacion: React.FC<ControlMiUbicacionProps> = ({
  cargando,
  activo,
  onSolicitarUbicacion,
  posicion = 'bottomright',
}) => {
  const handleRef = (el: HTMLDivElement | null) => {
    if (el) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  };

  return (
    <div
      ref={handleRef}
      className={`control-mi-ubicacion-flotante pos-${posicion}`}
    >
      <button
        type="button"
        className={`btn-mi-ubicacion-mapa ${activo ? 'activo' : ''} ${
          cargando ? 'cargando' : ''
        }`}
        onClick={onSolicitarUbicacion}
        disabled={cargando}
        aria-label="Centrar mapa en mi ubicación"
        title="Centrar en mi ubicación"
      >
        {cargando ? (
          <span className="spinner-ubicacion" aria-hidden="true" />
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icono-crosshair"
          >
            <circle cx="12" cy="12" r="7" />
            <line x1="12" y1="1" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="1" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="23" y2="12" />
            <circle cx="12" cy="12" r="2.2" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
};

