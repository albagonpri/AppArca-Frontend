import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { iniciarSesion, guardarToken, guardarUsuarioSesion } from '../services/auth.service';

export const IniciarSesion: React.FC = () => {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!correo.trim() || !contrasena) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    const correoEnvio = correo.trim();
    const contrasenaEnvio = contrasena;

    // Limpiar los campos al enviar
    setCorreo('');
    setContrasena('');

    setCargando(true);

    try {
      const respuesta = await iniciarSesion({
        correo: correoEnvio,
        contrasena: contrasenaEnvio,
      });

      // Guardar el JWT y los datos del usuario en localStorage de forma centralizada
      guardarToken(respuesta.token);
      if (respuesta.usuario) {
        guardarUsuarioSesion(respuesta.usuario);
      }

      // Redirigir al inicio de la aplicación
      navigate('/');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al iniciar sesión.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="page-header">
          <h1 className="page-title">Iniciar sesión</h1>
          <p className="page-subtitle">Accede a tu cuenta de AppArca</p>
        </div>

        {error && (
          <div className="mensaje-alerta mensaje-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="formulario" autoComplete="off">
          <div className="form-group">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={cargando}
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                id="contrasena"
                type={mostrarContrasena ? 'text' : 'password'}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                disabled={cargando}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setMostrarContrasena((prev) => !prev)}
                aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarContrasena ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={cargando}
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <span>¿No tienes una cuenta?</span>{' '}
          <Link to="/registro" className="auth-link">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
