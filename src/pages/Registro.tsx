import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { registrar, iniciarSesion, guardarToken, guardarUsuarioSesion } from '../services/auth.service';

export const Registro: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const state = location.state as { plazaId?: number } | null;
  const plazaIdParam = searchParams.get('plazaId');
  const targetPlazaId = state?.plazaId || (plazaIdParam ? parseInt(plazaIdParam, 10) : null);

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [repetirCorreo, setRepetirCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [repetirContrasena, setRepetirContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarRepetirContrasena, setMostrarRepetirContrasena] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cumpleLongitud = contrasena.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Comprobación de campos obligatorios
    if (!nombre.trim() || !correo.trim() || !repetirCorreo.trim() || !contrasena || !repetirContrasena) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    // Comprobación de coincidencia de correo electrónico
    if (correo.trim().toLowerCase() !== repetirCorreo.trim().toLowerCase()) {
      setError('Los correos electrónicos no coinciden.');
      return;
    }

    // Comprobación del requisito de longitud mínima de contraseña
    if (contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Comprobación de coincidencia de contraseñas
    if (contrasena !== repetirContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const nombreEnvio = nombre.trim();
    const correoEnvio = correo.trim();
    const contrasenaEnvio = contrasena;

    setCargando(true);

    try {
      // 1. Registro en el backend
      await registrar({
        nombre: nombreEnvio,
        correo: correoEnvio,
        contrasena: contrasenaEnvio,
      });

      // 2. Inicio de sesión automático inmediato
      try {
        const respuestaLogin = await iniciarSesion({
          correo: correoEnvio,
          contrasena: contrasenaEnvio,
        });

        guardarToken(respuestaLogin.token);
        if (respuestaLogin.usuario) {
          guardarUsuarioSesion(respuestaLogin.usuario);
        }

        // Redirigir directamente al inicio o a la plaza que estaba consultando
        if (targetPlazaId) {
          navigate(`/?plazaId=${targetPlazaId}`);
        } else {
          navigate('/');
        }
      } catch {
        setError(
          'Cuenta creada correctamente, pero ocurrió un problema al iniciar sesión de forma automática. Por favor, inicia sesión manualmente.'
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al registrar el usuario.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="page-header">
          <h1 className="page-title">Registro de usuario</h1>
          <p className="page-subtitle">Crea tu cuenta en AppArca</p>
        </div>

        {error && (
          <div className="mensaje-alerta mensaje-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="formulario" autoComplete="off">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              disabled={cargando}
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ejemplo@gmail.com"
              disabled={cargando}
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="repetirCorreo">Confirmar correo electrónico</label>
            <input
              id="repetirCorreo"
              type="email"
              value={repetirCorreo}
              onChange={(e) => setRepetirCorreo(e.target.value)}
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
            <div className="password-requirements" aria-live="polite">
              <div className={`requirement-item ${cumpleLongitud ? 'met' : 'unmet'}`}>
                <span className="requirement-icon">{cumpleLongitud ? '✓' : '○'}</span>
                <span>Mínimo 6 caracteres</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="repetirContrasena">Repetir contraseña</label>
            <div className="password-input-wrapper">
              <input
                id="repetirContrasena"
                type={mostrarRepetirContrasena ? 'text' : 'password'}
                value={repetirContrasena}
                onChange={(e) => setRepetirContrasena(e.target.value)}
                disabled={cargando}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setMostrarRepetirContrasena((prev) => !prev)}
                aria-label={mostrarRepetirContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={mostrarRepetirContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarRepetirContrasena ? (
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
            {cargando ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-footer">
          <span>¿Ya tienes una cuenta?</span>{' '}
          <Link to="/iniciar-sesion" className="auth-link">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
};
