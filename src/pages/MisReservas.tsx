import React, { useState } from 'react';
import { FormularioReserva } from '../components/reservas/FormularioReserva';
// Preparado para conectar con obtenerReservasUsuario(id) mediante GET /usuarios/:id/reservas cuando exista autenticación
// import type { Reserva } from '../models/reserva.model';
// import { obtenerReservasUsuario } from '../services/usuarios.service';

export const MisReservas: React.FC = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);

  const handleReservaCreada = () => {
    setMostrarFormulario(false);
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Mis Reservas</h1>
        <p className="page-subtitle">Historial y estado de tus reservas de plazas</p>
      </header>

      <section className="page-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 className="section-title" style={{ margin: 0, borderBottom: 'none' }}>Historial de Reservas</h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            {mostrarFormulario ? 'Ocultar formulario' : '+ Nueva reserva'}
          </button>
        </div>

        <div className="mensaje-alerta mensaje-info">
          Este apartado mostrará tus reservas realizadas (plaza, fechas y estado) conectándose al endpoint <code>GET /usuarios/:id/reservas</code> en cuanto esté disponible la autenticación en el backend.
        </div>
      </section>

      {mostrarFormulario && (
        <section className="page-section">
          <h2 className="section-title">Crear Nueva Reserva</h2>
          <FormularioReserva onReservaCreada={handleReservaCreada} />
        </section>
      )}
    </div>
  );
};
