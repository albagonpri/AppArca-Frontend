import React from 'react';
import type { Reserva } from '../../models/reserva.model';
import type { PaginacionMeta } from '../../models/paginacion.model';
import { Paginacion } from '../comun/Paginacion';

interface Props {
  reservas: Reserva[];
  reservaSeleccionadaId: number | null;
  onSeleccionarReserva: (id: number) => void;
  meta?: PaginacionMeta;
  alCambiarPagina?: (pagina: number) => void;
  alCambiarLimite?: (limite: number) => void;
  cargando?: boolean;
}

export const ListaReservas: React.FC<Props> = ({
  reservas,
  reservaSeleccionadaId,
  onSeleccionarReserva,
  meta,
  alCambiarPagina,
  alCambiarLimite,
  cargando,
}) => {
  if (reservas.length === 0) {
    return <p className="empty-text">No hay reservas registradas en el sistema.</p>;
  }

  const obtenerClaseEstado = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'CONFIRMADA':
      case 'COMPLETADA':
        return 'badge badge-success';
      case 'PENDIENTE':
        return 'badge badge-warning';
      case 'CANCELADA':
        return 'badge badge-danger';
      default:
        return 'badge badge-neutral';
    }
  };

  return (
    <div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Plaza</th>
              <th>Fecha de inicio</th>
              <th>Fecha de fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((reserva) => (
              <tr
                key={reserva.id}
                style={{
                  backgroundColor:
                    reservaSeleccionadaId === reserva.id
                      ? 'rgba(24, 183, 160, 0.12)'
                      : undefined,
                }}
              >
                <td>#{reserva.id}</td>
                <td>
                  {reserva.usuario
                    ? `${reserva.usuario.nombre} (#${reserva.usuario.id})`
                    : `Usuario #${reserva.usuarioId}`}
                </td>
                <td>
                  {reserva.plaza
                    ? `${reserva.plaza.titulo} (#${reserva.plaza.id})`
                    : `Plaza #${reserva.plazaId}`}
                </td>
                <td>{new Date(reserva.fechaInicio).toLocaleString()}</td>
                <td>{new Date(reserva.fechaFin).toLocaleString()}</td>
                <td>
                  <span className={obtenerClaseEstado(reserva.estado)}>
                    {reserva.estado}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSeleccionarReserva(reserva.id)}
                  >
                    {reservaSeleccionadaId === reserva.id ? 'Viendo detalle' : 'Ver detalle'}
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
          etiquetaRecursos="reservas"
        />
      )}
    </div>
  );
};
