import React from 'react';
import type { EtiquetaAmbiental } from '../../models/vehiculo.model';
import { obtenerTextoEtiqueta } from '../../models/vehiculo.model';

interface Props {
  etiqueta?: EtiquetaAmbiental | null;
  tamano?: 'sm' | 'base';
}

export const EtiquetaAmbientalBadge: React.FC<Props> = ({ etiqueta, tamano = 'base' }) => {
  if (!etiqueta) return null;

  const claseModificador = `badge-etiqueta-${etiqueta.toLowerCase()}`;
  const texto = obtenerTextoEtiqueta(etiqueta);

  return (
    <span
      className={`badge-etiqueta ${claseModificador} badge-etiqueta-${tamano}`}
      title={`Etiqueta ambiental: ${texto}`}
    >
      <span className="badge-etiqueta-icono" aria-hidden="true">🌱</span>
      <span className="badge-etiqueta-texto">{texto}</span>
    </span>
  );
};
