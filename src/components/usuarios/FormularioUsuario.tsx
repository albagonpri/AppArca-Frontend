import React, { useState } from 'react';
import { crearUsuario } from '../../services/usuarios.service';

interface Props {
  onUsuarioCreado: () => void;
}

export const FormularioUsuario: React.FC<Props> = ({ onUsuarioCreado }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (!nombre.trim() || !correo.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    try {
      setCargando(true);
      await crearUsuario({
        nombre: nombre.trim(),
        correo: correo.trim(),
      });
      setExito('Usuario creado correctamente.');
      setNombre('');
      setCorreo('');
      onUsuarioCreado();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al crear el usuario.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={handleSubmit}>
      {error && <div className="mensaje-alerta mensaje-error">{error}</div>}
      {exito && <div className="mensaje-alerta mensaje-exito">{exito}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            placeholder="Ej. Martín"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={cargando}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="correo">Correo electrónico</label>
          <input
            id="correo"
            type="email"
            placeholder="Ej. martin@email.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={cargando}
            required
          />
        </div>
      </div>

      <div className="btn-group">
        <button type="submit" className="btn btn-primary" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  );
};
