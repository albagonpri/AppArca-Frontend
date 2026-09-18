import React, { useState } from 'react';
import { crearReserva } from '../../services/reservas.service';

interface Props {
  onReservaCreada: () => void;
}

export const FormularioReserva: React.FC<Props> = ({ onReservaCreada }) => {
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [plazaId, setPlazaId] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    const usrIdNum = parseInt(usuarioId, 10);
    const plzIdNum = parseInt(plazaId, 10);

    if (isNaN(usrIdNum) || isNaN(plzIdNum) || !fechaInicio || !fechaFin) {
      setError('Por favor, completa todos los campos del formulario.');
      return;
    }

    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);

    if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
      setError('Las fechas introducidas no son válidas.');
      return;
    }

    if (fechaInicioDate >= fechaFinDate) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    try {
      setCargando(true);
      // Conversión al formato ISO 8601 que espera la API
      await crearReserva({
        usuarioId: usrIdNum,
        plazaId: plzIdNum,
        fechaInicio: fechaInicioDate.toISOString(),
        fechaFin: fechaFinDate.toISOString(),
      });

      setExito('Reserva creada con éxito.');
      setUsuarioId('');
      setPlazaId('');
      setFechaInicio('');
      setFechaFin('');
      onReservaCreada();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al registrar la reserva.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={handleSubmit}>
      {error && <div className="mensaje-alerta mensaje-error">{error}</div>}
      {exito && <div className="mensaje-alerta mensaje-exito">{exito}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="usuarioId">ID del Usuario (Conductor)</label>
          <input
            id="usuarioId"
            type="number"
            min="1"
            placeholder="Ej. 2"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            disabled={cargando}
            required
          />
          <span className="form-hint">ID del usuario que realiza la reserva</span>
        </div>

        <div className="form-group">
          <label htmlFor="plazaId">ID de la Plaza</label>
          <input
            id="plazaId"
            type="number"
            min="1"
            placeholder="Ej. 1"
            value={plazaId}
            onChange={(e) => setPlazaId(e.target.value)}
            disabled={cargando}
            required
          />
          <span className="form-hint">ID de la plaza de aparcamiento deseada</span>
        </div>

        <div className="form-group">
          <label htmlFor="fechaInicio">Fecha y hora de inicio</label>
          <input
            id="fechaInicio"
            type="datetime-local"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            disabled={cargando}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="fechaFin">Fecha y hora de fin</label>
          <input
            id="fechaFin"
            type="datetime-local"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            disabled={cargando}
            required
          />
        </div>
      </div>

      <div className="btn-group">
        <button type="submit" className="btn btn-primary" disabled={cargando}>
          {cargando ? 'Registrando reserva...' : 'Crear Reserva'}
        </button>
      </div>
    </form>
  );
};
