import React from 'react';
import type { Usuario } from '../../models/usuario.model';
import type { PaginacionMeta } from '../../models/paginacion.model';
import { Paginacion } from '../comun/Paginacion';

interface Props {
  usuarios: Usuario[];
  usuarioSeleccionadoId: number | null;
  onSeleccionarUsuario: (id: number) => void;
  meta?: PaginacionMeta;
  alCambiarPagina?: (pagina: number) => void;
  alCambiarLimite?: (limite: number) => void;
  cargando?: boolean;
}

export const ListaUsuarios: React.FC<Props> = ({
  usuarios,
  usuarioSeleccionadoId,
  onSeleccionarUsuario,
  meta,
  alCambiarPagina,
  alCambiarLimite,
  cargando,
}) => {
  if (usuarios.length === 0) {
    return <p className="empty-text">No hay usuarios registrados en el sistema.</p>;
  }

  return (
    <div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Fecha de registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr
                key={usuario.id}
                style={{
                  backgroundColor:
                    usuarioSeleccionadoId === usuario.id
                      ? 'rgba(24, 183, 160, 0.12)'
                      : undefined,
                }}
              >
                <td>#{usuario.id}</td>
                <td>
                  <strong>{usuario.nombre}</strong>
                </td>
                <td>{usuario.correo}</td>
                <td>{new Date(usuario.fechaCreacion).toLocaleString()}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSeleccionarUsuario(usuario.id)}
                  >
                    {usuarioSeleccionadoId === usuario.id ? 'Viendo detalle' : 'Ver detalle'}
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
          etiquetaRecursos="usuarios"
        />
      )}
    </div>
  );
};
