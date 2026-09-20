import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const Inicio: React.FC = () => {
  const { autenticado } = useAuth();

  if (!autenticado) {
    return (
      <div className="inicio-unauth">
        <h1 className="inicio-unauth-title">
          App<span>Arca</span>
        </h1>
        <p className="inicio-unauth-subtitle">
          Bienvenido a la plataforma de gestión y reserva de plazas de aparcamiento.
        </p>
        <div className="inicio-unauth-actions">
          <Link to="/iniciar-sesion" className="btn btn-primary">
            Iniciar sesión
          </Link>
          <Link to="/registro" className="btn btn-secondary">
            Registrarse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="inicio-container">
      {/* Área preparada para desarrollar el contenido inicial de la aplicación */}
    </div>
  );
};
