import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export const Navbar: React.FC = () => {
  const { autenticado } = useAuth();
  const location = useLocation();

  const esRutaAuth = location.pathname === '/iniciar-sesion' || location.pathname === '/registro';

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <NavLink to="/" className="navbar-brand">
          App<span>Arca</span>
        </NavLink>

        {autenticado ? (
          <ul className="navbar-links nav-4-items">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                end
              >
                Inicio
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/mi-plaza"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Mi plaza
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/mis-reservas"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Mis Reservas
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/mi-perfil"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Mi perfil
              </NavLink>
            </li>
          </ul>
        ) : (
          <ul className="navbar-links nav-2-items">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => (isActive && !esRutaAuth ? 'nav-link active' : 'nav-link')}
                end
              >
                Inicio
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/iniciar-sesion"
                className={esRutaAuth ? 'nav-link active' : 'nav-link'}
              >
                Iniciar sesión / Registrarse
              </NavLink>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};
