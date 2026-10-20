import React from 'react';
import type { Plaza } from '../../models/plaza.model';
import type { PaginacionMeta } from '../../models/paginacion.model';
import { Paginacion } from '../comun/Paginacion';

interface Props {
  plazas: Plaza[];
  plazaSeleccionadaId: number | null;
  onSeleccionarPlaza: (id: number) => void;
  meta?: PaginacionMeta;
  alCambiarPagina?: (pagina: number) => void;
  alCambiarLimite?: (limite: number) => void;
  cargando?: boolean;
}

export const ListaPlazas: React.FC<Props> = ({
  plazas,
  plazaSeleccionadaId,
  onSeleccionarPlaza,
  meta,
  alCambiarPagina,
  alCambiarLimite,
  cargando,
}) => {
  if (plazas.length === 0) {
    return <p className="empty-text">No hay plazas de aparcamiento disponibles o registradas.</p>;
  }

  return (
    <div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Descripción</th>
              <th>Dirección</th>
              <th>Dimensiones</th>
              <th>Precio/h</th>
              <th>Disponibilidad</th>
              <th>Propietario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {plazas.map((plaza) => (
              <tr
                key={plaza.id}
                style={{
                  backgroundColor:
                    plazaSeleccionadaId === plaza.id
                      ? 'rgba(24, 183, 160, 0.12)'
                      : undefined,
                }}
              >
                <td>#{plaza.id}</td>
                <td>
                  <strong>{plaza.titulo}</strong>
                </td>
                <td>{plaza.descripcion}</td>
                <td>{plaza.direccion}</td>
                <td>{plaza.largo} × {plaza.ancho} m</td>
                <td>{plaza.precioHora} €</td>
                <td>
                  <span
                    className={`badge ${plaza.disponible ? 'badge-success' : 'badge-danger'}`}
                  >
                    {plaza.disponible ? 'Disponible' : 'No disponible'}
                  </span>
                </td>
                <td>
                  {plaza.propietario
                    ? `${plaza.propietario.nombre} (#${plaza.propietario.id})`
                    : `Usuario #${plaza.propietarioId}`}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSeleccionarPlaza(plaza.id)}
                  >
                    {plazaSeleccionadaId === plaza.id ? 'Viendo detalle' : 'Ver detalle'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && alCambiarPagina && (
        <Paginacion
          meta={meta}
          alCambiarPagina={alCambiarPagina}
          alCambiarLimite={alCambiarLimite}
          cargando={cargando}
          etiquetaRecursos="plazas"
        />
      )}
    </div>
  );
};
