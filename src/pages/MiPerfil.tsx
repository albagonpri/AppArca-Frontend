import React, { useState, useEffect } from 'react';
import type { Usuario } from '../models/usuario.model';
import { obtenerPerfil } from '../services/auth.service';

export const MiPerfil: React.FC = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const cargarDatosPerfil = async () => {
      try {
        setCargando(true);
        setError(null);
        const datos = await obtenerPerfil();
        if (isMounted) {
          setUsuario(datos);
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('No se pudieron cargar los datos del perfil.');
          }
        }
      } finally {
        if (isMounted) {
          setCargando(false);
        }
      }
    };

    void cargarDatosPerfil();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Mi perfil</h1>
        <p className="page-subtitle">Información de tu cuenta en AppArca</p>
      </header>

      {cargando && (
        <div className="mensaje-alerta mensaje-info">
          Cargando datos del perfil...
        </div>
      )}

      {error && (
        <div className="mensaje-alerta mensaje-error" role="alert">
          {error}
        </div>
      )}

      {!cargando && usuario && (
        <section className="page-section">
          <h2 className="section-title">Datos del Usuario</h2>
          <div className="detalle-datos">
            <div className="dato-item">
              <span className="dato-label">Nombre</span>
              <span className="dato-valor">{usuario.nombre}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Correo electrónico</span>
              <span className="dato-valor">{usuario.correo}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
