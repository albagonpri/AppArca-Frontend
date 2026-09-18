import React from 'react';
// Preparado para conectar con obtenerUsuarioPorId(id) cuando se disponga de autenticación
// import type { Usuario } from '../models/usuario.model';
// import { obtenerUsuarioPorId } from '../services/usuarios.service';

export const MiPerfil: React.FC = () => {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Mi perfil</h1>
        <p className="page-subtitle">Información de tu cuenta en AppArca</p>
      </header>

      <section className="page-section">
        <h2 className="section-title">Datos del Usuario</h2>
        <div className="detalle-datos">
          <div className="dato-item">
            <span className="dato-label">Nombre</span>
            <span className="dato-valor" style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>
              Pendiente de inicio de sesión
            </span>
          </div>
          <div className="dato-item">
            <span className="dato-label">Correo electrónico</span>
            <span className="dato-valor" style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>
              Pendiente de inicio de sesión
            </span>
          </div>
        </div>

        <div className="mensaje-alerta mensaje-info" style={{ marginTop: 'var(--spacing-md)' }}>
          Esta sección está preparada para mostrar los datos del usuario conectado mediante el endpoint <code>GET /usuarios/:id</code> en cuanto se integre el sistema de autenticación en el backend.
        </div>
      </section>
    </div>
  );
};
