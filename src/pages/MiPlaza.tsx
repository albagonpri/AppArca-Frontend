import React, { useState } from 'react';
import { FormularioPlaza } from '../components/plazas/FormularioPlaza';
// Preparado para conectar con obtenerPlazasUsuario(id) mediante GET /usuarios/:id/plazas cuando exista autenticación
// import type { Plaza } from '../models/plaza.model';
// import { obtenerPlazasUsuario } from '../services/usuarios.service';

export const MiPlaza: React.FC = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);

  const handlePlazaCreada = () => {
    setMostrarFormulario(false);
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Mi plaza</h1>
        <p className="page-subtitle">Gestión y publicación de tus plazas de aparcamiento</p>
      </header>

      <section className="page-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 className="section-title" style={{ margin: 0, borderBottom: 'none' }}>Mis Plazas</h2>
          <button
            type="button"
            className="btn btn-accent btn-sm"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            {mostrarFormulario ? 'Ocultar formulario' : '+ Publicar plaza'}
          </button>
        </div>

        <div className="mensaje-alerta mensaje-info">
          Este apartado mostrará automáticamente tus plazas publicadas conectándose al endpoint <code>GET /usuarios/:id/plazas</code> en cuanto esté disponible la autenticación en el backend.
        </div>
      </section>

      {mostrarFormulario && (
        <section className="page-section">
          <h2 className="section-title">Publicar Nueva Plaza</h2>
          <FormularioPlaza onPlazaCreada={handlePlazaCreada} />
        </section>
      )}
    </div>
  );
};
