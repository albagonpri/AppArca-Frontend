import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <NavLink to="/" className="navbar-brand">
          App<span>Arca</span>
        </NavLink>
        <ul className="navbar-links">
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
      </div>
    </nav>
  );
};
