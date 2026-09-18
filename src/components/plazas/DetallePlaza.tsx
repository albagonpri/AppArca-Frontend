import React, { useEffect, useState } from 'react';
import type { Plaza } from '../../models/plaza.model';
import type { Reserva } from '../../models/reserva.model';
import { obtenerPlazaPorId, obtenerReservasPlaza } from '../../services/plazas.service';

interface Props {
  plazaId: number;
  onCerrar: () => void;
}

export const DetallePlaza: React.FC<Props> = ({ plazaId, onCerrar }) => {
  const [plaza, setPlaza] = useState<Plaza | null>(null);
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
        const [plazaData, reservasData] = await Promise.all([
          obtenerPlazaPorId(plazaId),
          obtenerReservasPlaza(plazaId),
        ]);

        if (activo) {
          setPlaza(plazaData);
          setReservas(reservasData);
        }
      } catch (err: unknown) {
        if (activo) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Error al obtener la información de la plaza.');
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
  }, [plazaId]);

  return (
    <div className="detalle-container">
      <div className="detalle-header">
        <h3 className="detalle-title">Detalle de la Plaza #{plazaId}</h3>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCerrar}>
          Cerrar detalle
        </button>
      </div>

      {cargando && <p className="loading-text">Cargando información de la plaza...</p>}
      {error && <div className="mensaje-alerta mensaje-error">{error}</div>}

      {!cargando && !error && plaza && (
        <>
          <div className="detalle-datos">
            <div className="dato-item">
              <span className="dato-label">Título</span>
              <span className="dato-valor">{plaza.titulo}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Dirección</span>
              <span className="dato-valor">{plaza.direccion}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Precio por hora</span>
              <span className="dato-valor">{plaza.precioHora} €/h</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Disponibilidad</span>
              <span className="dato-valor">
                <span className={`badge ${plaza.disponible ? 'badge-success' : 'badge-danger'}`}>
                  {plaza.disponible ? 'Disponible' : 'No disponible'}
                </span>
              </span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Propietario</span>
              <span className="dato-valor">
                {plaza.propietario
                  ? `${plaza.propietario.nombre} (${plaza.propietario.correo})`
                  : `ID #${plaza.propietarioId}`}
              </span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Coordenadas</span>
              <span className="dato-valor">
                Lat: {plaza.latitud} | Lon: {plaza.longitud}
              </span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Descripción</span>
              <span className="dato-valor">{plaza.descripcion}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Fecha de creación</span>
              <span className="dato-valor">{new Date(plaza.fechaCreacion).toLocaleString()}</span>
            </div>
          </div>

          <div className="subseccion-detalle">
            <h4 className="subseccion-titulo">Reservas para esta plaza ({reservas.length})</h4>
            {reservas.length === 0 ? (
              <p className="empty-text">No hay reservas registradas para esta plaza.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID Reserva</th>
                      <th>ID Usuario</th>
                      <th>Fecha de inicio</th>
                      <th>Fecha de fin</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.map((r) => (
                      <tr key={r.id}>
                        <td>#{r.id}</td>
                        <td>
                          {r.usuario
                            ? `${r.usuario.nombre} (#${r.usuario.id})`
                            : `Usuario #${r.usuarioId}`}
                        </td>
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
