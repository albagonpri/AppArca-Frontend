import React, { useState } from 'react';
import { crearPlaza } from '../../services/plazas.service';

interface Props {
  onPlazaCreada: () => void;
}

export const FormularioPlaza: React.FC<Props> = ({ onPlazaCreada }) => {
  const [propietarioId, setPropietarioId] = useState<string>('');
  const [titulo, setTitulo] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [latitud, setLatitud] = useState<string>('');
  const [longitud, setLongitud] = useState<string>('');
  const [precioHora, setPrecioHora] = useState<string>('');

  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    const propIdNum = parseInt(propietarioId, 10);
    const latNum = parseFloat(latitud);
    const lonNum = parseFloat(longitud);
    const precioNum = parseFloat(precioHora);

    if (
      isNaN(propIdNum) ||
      !titulo.trim() ||
      !descripcion.trim() ||
      !direccion.trim() ||
      isNaN(latNum) ||
      isNaN(lonNum) ||
      isNaN(precioNum)
    ) {
      setError('Por favor, completa todos los campos con valores numéricos válidos.');
      return;
    }

    try {
      setCargando(true);
      await crearPlaza({
        propietarioId: propIdNum,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        latitud: latNum,
        longitud: lonNum,
        precioHora: precioNum,
      });

      setExito('Plaza registrada con éxito.');
      setPropietarioId('');
      setTitulo('');
      setDescripcion('');
      setDireccion('');
      setLatitud('');
      setLongitud('');
      setPrecioHora('');
      onPlazaCreada();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al registrar la plaza.');
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
          <label htmlFor="propietarioId">ID del Propietario</label>
          <input
            id="propietarioId"
            type="number"
            min="1"
            placeholder="Ej. 1"
            value={propietarioId}
            onChange={(e) => setPropietarioId(e.target.value)}
            disabled={cargando}
            required
          />
          <span className="form-hint">ID del usuario que publica la plaza</span>
        </div>

        <div className="form-group">
          <label htmlFor="titulo">Título de la plaza</label>
          <input
            id="titulo"
            type="text"
            placeholder="Ej. Plaza amplia en el centro"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={cargando}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="direccion">Dirección</label>
          <input
            id="direccion"
            type="text"
            placeholder="Ej. Rúa do Paseo 12, Ourense"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            disabled={cargando}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="precioHora">Precio por hora (€)</label>
          <input
            id="precioHora"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej. 1.50"
            value={precioHora}
            onChange={(e) => setPrecioHora(e.target.value)}
            disabled={cargando}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="latitud">Latitud</label>
          <input
            id="latitud"
            type="number"
            step="any"
            placeholder="Ej. 42.34"
            value={latitud}
            onChange={(e) => setLatitud(e.target.value)}
            disabled={cargando}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="longitud">Longitud</label>
          <input
            id="longitud"
            type="number"
            step="any"
            placeholder="Ej. -7.86"
            value={longitud}
            onChange={(e) => setLongitud(e.target.value)}
            disabled={cargando}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          rows={3}
          placeholder="Ej. Plaza cubierta, fácil maniobra, portón automático."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          disabled={cargando}
          required
        />
      </div>

      <div className="btn-group">
        <button type="submit" className="btn btn-primary" disabled={cargando}>
          {cargando ? 'Guardando plaza...' : 'Registrar Plaza'}
        </button>
      </div>
    </form>
  );
};
