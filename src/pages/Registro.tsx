import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrar, iniciarSesion, guardarToken, guardarUsuarioSesion } from '../services/auth.service';

export const Registro: React.FC = () => {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [repetirCorreo, setRepetirCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [repetirContrasena, setRepetirContrasena] = useState('');

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

        // Redirigir directamente al inicio
        navigate('/');
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
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              disabled={cargando}
              autoComplete="new-password"
              required
            />
            <div className="password-requirements" aria-live="polite">
              <div className={`requirement-item ${cumpleLongitud ? 'met' : 'unmet'}`}>
                <span className="requirement-icon">{cumpleLongitud ? '✓' : '○'}</span>
                <span>Mínimo 6 caracteres</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="repetirContrasena">Repetir contraseña</label>
            <input
              id="repetirContrasena"
              type="password"
              value={repetirContrasena}
              onChange={(e) => setRepetirContrasena(e.target.value)}
              disabled={cargando}
              autoComplete="new-password"
              required
            />
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
