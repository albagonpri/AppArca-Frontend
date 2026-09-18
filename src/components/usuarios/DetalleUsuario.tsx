import React, { useEffect, useState } from 'react';
import type { Usuario } from '../../models/usuario.model';
import type { Plaza } from '../../models/plaza.model';
import type { Reserva } from '../../models/reserva.model';
import {
  obtenerUsuarioPorId,
  obtenerPlazasUsuario,
  obtenerReservasUsuario,
} from '../../services/usuarios.service';

interface Props {
  usuarioId: number;
  onCerrar: () => void;
}

export const DetalleUsuario: React.FC<Props> = ({ usuarioId, onCerrar }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    const cargarDetalles = async () => {
      try {
        setCargando(true);
        setError(null);

        // Llamamos explícitamente a los endpoints individuales del backend
        const [usuarioData, plazasData, reservasData] = await Promise.all([
          obtenerUsuarioPorId(usuarioId),
          obtenerPlazasUsuario(usuarioId),
          obtenerReservasUsuario(usuarioId),
        ]);

        if (activo) {
          setUsuario(usuarioData);
          setPlazas(plazasData);
          setReservas(reservasData);
        }
      } catch (err: unknown) {
        if (activo) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Error al obtener la información detallada del usuario.');
          }
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarDetalles();

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  return (
    <div className="detalle-container">
      <div className="detalle-header">
        <h3 className="detalle-title">Detalle del Usuario #{usuarioId}</h3>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCerrar}>
          Cerrar detalle
        </button>
      </div>

      {cargando && <p className="loading-text">Cargando información del usuario...</p>}
      {error && <div className="mensaje-alerta mensaje-error">{error}</div>}

      {!cargando && !error && usuario && (
        <>
          <div className="detalle-datos">
            <div className="dato-item">
              <span className="dato-label">ID</span>
              <span className="dato-valor">#{usuario.id}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Nombre</span>
              <span className="dato-valor">{usuario.nombre}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Correo</span>
              <span className="dato-valor">{usuario.correo}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Fecha de creación</span>
              <span className="dato-valor">{new Date(usuario.fechaCreacion).toLocaleString()}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Última actualización</span>
              <span className="dato-valor">
                {new Date(usuario.fechaActualizacion).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="subseccion-detalle">
            <h4 className="subseccion-titulo">Plazas en propiedad ({plazas.length})</h4>
            {plazas.length === 0 ? (
              <p className="empty-text">Este usuario no tiene plazas registradas.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Título</th>
                      <th>Dirección</th>
                      <th>Precio/h</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plazas.map((p) => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td>{p.titulo}</td>
                        <td>{p.direccion}</td>
                        <td>{p.precioHora} €</td>
                        <td>
                          <span
                            className={`badge ${p.disponible ? 'badge-success' : 'badge-danger'}`}
                          >
                            {p.disponible ? 'Disponible' : 'Ocupada'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="subseccion-detalle">
            <h4 className="subseccion-titulo">Reservas realizadas ({reservas.length})</h4>
            {reservas.length === 0 ? (
              <p className="empty-text">Este usuario no ha realizado ninguna reserva.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Plaza ID</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.map((r) => (
                      <tr key={r.id}>
                        <td>#{r.id}</td>
                        <td>#{r.plazaId}</td>
                        <td>{new Date(r.fechaInicio).toLocaleString()}</td>
                        <td>{new Date(r.fechaFin).toLocaleString()}</td>
                        <td>
                          <span className="badge badge-warning">{r.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
