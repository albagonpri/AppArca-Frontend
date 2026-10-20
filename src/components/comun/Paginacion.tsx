import React from 'react';
import type { PaginacionMeta } from '../../models/paginacion.model';
import './Paginacion.css';

export interface PaginacionProps {
  meta: PaginacionMeta;
  alCambiarPagina: (pagina: number) => void;
  alCambiarLimite?: (limite: number) => void;
  opcionesLimite?: number[];
  cargando?: boolean;
  etiquetaRecursos?: string;
}

export const Paginacion: React.FC<PaginacionProps> = ({
  meta,
  alCambiarPagina,
  alCambiarLimite,
  opcionesLimite = [10, 20, 50],
  cargando = false,
  etiquetaRecursos = 'registros',
}) => {
  const { page, limit, total, totalPages, hasNextPage, hasPreviousPage } = meta;

  if (total === 0 || totalPages <= 0) {
    return null;
  }

  const desde = (page - 1) * limit + 1;
  const hasta = Math.min(page * limit, total);

  const obtenerNumerosPagina = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (page >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  const paginas = obtenerNumerosPagina();

  return (
    <nav className="paginacion-contenedor" aria-label="Navegación de páginas">
      <div className="paginacion-info">
        <span className="paginacion-resumen">
          Mostrando <strong>{desde}</strong>–<strong>{hasta}</strong> de{' '}
          <strong>{total}</strong> {etiquetaRecursos} (Página {page} de {totalPages})
        </span>

        {alCambiarLimite && (
          <div className="paginacion-limite-selector">
            <label htmlFor="selector-limite" className="paginacion-limite-label">
              Mostrar:
            </label>
            <select
              id="selector-limite"
              className="paginacion-select"
              value={limit}
              onChange={(e) => alCambiarLimite(Number(e.target.value))}
              disabled={cargando}
              aria-label="Registros por página"
            >
              {opcionesLimite.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion} por pág.
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="paginacion-controles">
        <button
          type="button"
          className="btn-paginacion btn-paginacion-nav"
          onClick={() => alCambiarPagina(page - 1)}
          disabled={!hasPreviousPage || cargando}
          aria-label="Ir a la página anterior"
        >
          ← Anterior
        </button>

        <div className="paginacion-numeros">
          {paginas.map((item, index) => {
            if (item === '...') {
              return (
                <span key={`elipsis-${index}`} className="paginacion-elipsis" aria-hidden="true">
                  …
                </span>
              );
            }

            const num = item as number;
            const esActivo = num === page;

            return (
              <button
                key={num}
                type="button"
                className={`btn-paginacion btn-paginacion-numero ${esActivo ? 'activo' : ''}`}
                onClick={() => alCambiarPagina(num)}
                disabled={cargando || esActivo}
                aria-current={esActivo ? 'page' : undefined}
                aria-label={`Página ${num}`}
              >
                {num}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="btn-paginacion btn-paginacion-nav"
          onClick={() => alCambiarPagina(page + 1)}
          disabled={!hasNextPage || cargando}
          aria-label="Ir a la página siguiente"
        >
          Siguiente →
        </button>
      </div>
    </nav>
  );
};
