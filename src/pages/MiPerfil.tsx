import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Usuario } from '../models/usuario.model';
import { obtenerPerfil, eliminarToken, actualizarNombre } from '../services/auth.service';

export const MiPerfil: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError('Escribe tu nombre.'); return; }
    setGuardando(true);
    setError(null);
    try {
      setUsuario(await actualizarNombre(nombre.trim()));
      setEditando(false);
      setExito(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el nombre.');
    } finally { setGuardando(false); }
  }

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

  const handleCerrarSesion = () => {
    eliminarToken();
    navigate('/iniciar-sesion');
  };

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
          {exito && <p role="status" className="mensaje-alerta mensaje-exito">Nombre actualizado.</p>}
          {editando ? <form onSubmit={guardar} className="form-group">
            <label htmlFor="nombre-perfil">Nombre</label>
            <input id="nombre-perfil" autoComplete="name" required value={nombre} onChange={e => setNombre(e.target.value)} disabled={guardando} />
            <div className="modal-acciones">
              <button type="submit" className="btn btn-primary" disabled={guardando || !nombre.trim()}>Guardar cambios</button>
              <button type="button" className="btn btn-secondary" disabled={guardando} onClick={() => { setEditando(false); setError(null); }}>Cancelar</button>
            </div>
          </form> : <button type="button" className="btn btn-secondary" onClick={() => { setNombre(usuario.nombre); setEditando(true); setExito(false); }}>Editar perfil</button>}
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

          <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleCerrarSesion}
            >
              Cerrar sesión
            </button>
          </div>
        </section>
      )}

      {!cargando && !usuario && (
        <section className="page-section">
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleCerrarSesion}
          >
            Cerrar sesión
          </button>
        </section>
      )}
    </div>
  );
};
