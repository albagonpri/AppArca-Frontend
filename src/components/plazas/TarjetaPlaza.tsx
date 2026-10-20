import React from 'react';
import type { Plaza } from '../../models/plaza.model';

interface Props {
  plaza: Plaza;
  onVer: (id: number) => void;
  onEditar: (plaza: Plaza) => void;
  onEliminar: (plaza: Plaza) => void;
}

export const TarjetaPlaza: React.FC<Props> = ({
  plaza,
  onVer,
  onEditar,
  onEliminar,
}) => {
  const precioFormateado = plaza.precioHora
    ? plaza.precioHora.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0,00';

  const largoFormateado = plaza.largo
    ? String(plaza.largo).replace('.', ',')
    : '0';

  const anchoFormateado = plaza.ancho
    ? String(plaza.ancho).replace('.', ',')
    : '0';

  return (
    <article className="plaza-card">
      <div className="plaza-card-header">
        <div className="plaza-info-principal">
          <h3 className="plaza-card-titulo">{plaza.titulo}</h3>
          <p className="plaza-card-direccion">{plaza.direccion}</p>
        </div>
        <span
          className={`badge ${plaza.disponible ? 'badge-success' : 'badge-danger'}`}
        >
          {plaza.disponible ? 'Disponible' : 'No disponible'}
        </span>
      </div>

      <div className="plaza-card-body">
        <div className="plaza-precio-tag">
          {precioFormateado} €/hora
        </div>

        <div className="plaza-dimensiones-bloque">
          <span className="plaza-dimension-texto">
            Dimensiones: {largoFormateado} × {anchoFormateado} m
          </span>
        </div>

        <div className="plaza-caracteristicas-lista">
          <div className="plaza-caracteristica-fila">
            <span className="plaza-caracteristica-etiqueta">Cámaras de seguridad:</span>
            <span className="plaza-caracteristica-valor">
              {plaza.tieneCamaras ? 'Sí' : 'No'}
            </span>
          </div>

          <div className="plaza-caracteristica-fila">
            <span className="plaza-caracteristica-etiqueta">Entrada difícil:</span>
            <span className="plaza-caracteristica-valor">
              {plaza.entradaDificil ? 'Sí' : 'No'}
            </span>
          </div>

          {plaza.entradaDificil && (
            <div
              className="plaza-dificultad-alerta"
              title="Esta plaza presenta dificultades de acceso. Consulta el detalle para ver las características."
            >
              ⚠️ {plaza.dificultadesEntrada && plaza.dificultadesEntrada.length > 1
                ? `${plaza.dificultadesEntrada.length} dificultades de acceso`
                : "Acceso con dificultad"}
            </div>
          )}
        </div>
      </div>

      <div className="plaza-card-acciones">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onVer(plaza.id)}
        >
          Ver
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onEditar(plaza)}
        >
          Editar
        </button>
        <button
          type="button"
          className="btn btn-danger-outline btn-sm"
          onClick={() => onEliminar(plaza)}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
};
