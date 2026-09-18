import React, { useEffect, useState } from 'react';
import type { Reserva } from '../../models/reserva.model';
import { obtenerReservaPorId } from '../../services/reservas.service';

interface Props {
  reservaId: number;
  onCerrar: () => void;
}

export const DetalleReserva: React.FC<Props> = ({ reservaId, onCerrar }) => {
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    const cargarDetalle = async () => {
      try {
        setCargando(true);
        setError(null);

        // Llamamos explícitamente al endpoint individual del backend
        const data = await obtenerReservaPorId(reservaId);

        if (activo) {
          setReserva(data);
        }
      } catch (err: unknown) {
        if (activo) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Error al obtener la información detallada de la reserva.');
          }
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarDetalle();

    return () => {
      activo = false;
    };
  }, [reservaId]);

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
    <div className="detalle-container">
      <div className="detalle-header">
        <h3 className="detalle-title">Detalle de la Reserva #{reservaId}</h3>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCerrar}>
          Cerrar detalle
        </button>
      </div>

      {cargando && <p className="loading-text">Cargando datos de la reserva...</p>}
      {error && <div className="mensaje-alerta mensaje-error">{error}</div>}

      {!cargando && !error && reserva && (
        <div className="detalle-datos">
          <div className="dato-item">
            <span className="dato-label">ID de Reserva</span>
            <span className="dato-valor">#{reserva.id}</span>
          </div>
          <div className="dato-item">
            <span className="dato-label">Estado</span>
            <span className="dato-valor">
              <span className={obtenerClaseEstado(reserva.estado)}>{reserva.estado}</span>
            </span>
          </div>
          <div className="dato-item">
            <span className="dato-label">Usuario</span>
            <span className="dato-valor">
              {reserva.usuario
                ? `${reserva.usuario.nombre} (${reserva.usuario.correo})`
                : `ID #${reserva.usuarioId}`}
            </span>
          </div>
          <div className="dato-item">
            <span className="dato-label">Plaza</span>
            <span className="dato-valor">
              {reserva.plaza
                ? `${reserva.plaza.titulo} - ${reserva.plaza.direccion}`
                : `ID #${reserva.plazaId}`}
            </span>
          </div>
          <div className="dato-item">
            <span className="dato-label">Fecha y hora de inicio</span>
            <span className="dato-valor">{new Date(reserva.fechaInicio).toLocaleString()}</span>
          </div>
          <div className="dato-item">
            <span className="dato-label">Fecha y hora de fin</span>
            <span className="dato-valor">{new Date(reserva.fechaFin).toLocaleString()}</span>
          </div>
          <div className="dato-item">
            <span className="dato-label">Fecha de creación</span>
            <span className="dato-valor">{new Date(reserva.fechaCreacion).toLocaleString()}</span>
          </div>
          <div className="dato-item">
            <span className="dato-label">Última actualización</span>
            <span className="dato-valor">
              {new Date(reserva.fechaActualizacion).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
