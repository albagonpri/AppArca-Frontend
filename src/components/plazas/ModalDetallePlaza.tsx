import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DetallePlaza } from './DetallePlaza';

interface Props {
  plazaId: number;
  onCerrar: () => void;
  abrirReservaDirecta?: boolean;
}

/**
 * Ventana modal de detalle de plaza montada mediante React Portal en document.body.
 * - Evita problemas de apilamiento y z-index generados por Leaflet y contenedores secundarios.
 * - Se posiciona siempre por encima del mapa, marcadores y controles (z-index: 100000).
 * - Bloquea el scroll del fondo (body) mientras permanece abierto.
 * - Soporta cierre mediante la tecla Escape, clic en el fondo y botón de cierre.
 * - Centrado en pantalla y con desplazamiento interno independiente.
 */
export const ModalDetallePlaza: React.FC<Props> = ({
  plazaId,
  onCerrar,
  abrirReservaDirecta = false,
}) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Bloquear desplazamiento del body y compensar ancho de barra de scroll
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCerrar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCerrar]);

  const contenidoModal = (
    <div
      className="modal-detalle-portal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detalle-plaza-titulo"
      onClick={(e) => {
        // Cerrar si se pulsa sobre el fondo oscuro
        if (e.target === e.currentTarget) {
          onCerrar();
        }
      }}
    >
      <div className="modal-detalle-portal-content">
        <DetallePlaza
          plazaId={plazaId}
          onCerrar={onCerrar}
          abrirReservaDirecta={abrirReservaDirecta}
        />
      </div>
    </div>
  );

  return createPortal(contenidoModal, document.body);
};

