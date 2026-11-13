import React, { useState, useEffect } from 'react';
import type { Reserva } from '../models/reserva.model';
import type { PaginacionMeta } from '../models/paginacion.model';
import { formatearEstadoReserva, obtenerClaseBadgeEstado } from '../models/reserva.model';
import { actualizarEstadoReserva, obtenerReservas } from '../services/reservas.service';
import { Paginacion } from '../components/comun/Paginacion';

export const MisReservas: React.FC = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<'propias' | 'recibidas'>('propias');
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [limitePorPagina, setLimitePorPagina] = useState<number>(10);
  const [metaPaginacion, setMetaPaginacion] = useState<PaginacionMeta | null>(null);

  const [abierta, setAbierta] = useState<number | null>(null);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [revision, setRevision] = useState(0);
  async function responder(id: number, estado: 'CONFIRMADA' | 'RECHAZADA') {
    setEnviando(true);
    setError(null);
    try {
      await actualizarEstadoReserva(id, estado, estado === 'RECHAZADA' ? motivo.trim() || undefined : undefined);
      setAbierta(null);
      setRevision(n => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo responder a la solicitud.');
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    const cargar = async () => {
      try {
        setError(null);
        setCargando(true);
        const res = await obtenerReservas({
          tipo,
          estado: filtroEstado || undefined,
          page: paginaActual,
          limit: limitePorPagina,
        });

        if (isMounted) {
          setReservas(res.data);
          setMetaPaginacion(res.meta);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar las reservas.',
          );
        }
      } finally {
        if (isMounted) {
          setCargando(false);
        }
      }
    };

    void cargar();

    return () => {
      isMounted = false;
    };
  }, [tipo, filtroEstado, paginaActual, limitePorPagina, revision]);

  const handleCambiarTipo = (nuevoTipo: 'propias' | 'recibidas') => {
    setAbierta(null);
    setTipo(nuevoTipo);
    setPaginaActual(1);
  };

  const handleCambiarFiltroEstado = (nuevoEstado: string) => {
    setFiltroEstado(nuevoEstado);
    setPaginaActual(1);
  };

  const handleCambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCambiarLimite = (nuevoLimite: number) => {
    setLimitePorPagina(nuevoLimite);
    setPaginaActual(1);
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Mis Reservas</h1>
        <p className="page-subtitle">Historial y gestión de tus reservas de plazas</p>
      </header>

      {error && (
        <div className="mensaje-alerta mensaje-error" role="alert">
          {error}
        </div>
      )}

      {/* Selector de pestañas: Propias vs Recibidas y Filtro de estado */}
      <section className="page-section" style={{ paddingBottom: 'var(--spacing-sm)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-md)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            <button
              type="button"
              className={`btn btn-sm ${tipo === 'propias' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleCambiarTipo('propias')}
            >
              Mis reservas como conductor
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tipo === 'recibidas' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleCambiarTipo('recibidas')}
            >
              Solicitudes recibidas en mis plazas
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <label htmlFor="filtro-estado" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
              Estado:
            </label>
            <select
              id="filtro-estado"
              className="paginacion-select"
              value={filtroEstado}
              onChange={(e) => handleCambiarFiltroEstado(e.target.value)}
              disabled={cargando}
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="CONFIRMADA">Confirmadas</option>
              <option value="COMPLETADA">Completadas</option>
              <option value="RECHAZADA">Rechazadas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>
        </div>
      </section>

      <section className="page-section">
        <h2 className="section-title">
          {tipo === 'propias'
            ? 'Reservas solicitadas por ti'
            : 'Reservas efectuadas en tus plazas publicadas'}
        </h2>

        {cargando && <p className="loading-text">Cargando reservas...</p>}

        {!cargando && reservas.length === 0 && (
          <div className="plazas-vacio">
            <p className="empty-text">
              {tipo === 'propias'
                ? 'No tienes ninguna reserva solicitada con los filtros seleccionados.'
                : 'No has recibido ninguna reserva para tus plazas con los filtros seleccionados.'}
            </p>
          </div>
        )}

        {!cargando && reservas.length > 0 && (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {tipo === 'recibidas' && <th>Conductor</th>}
                    <th>Plaza</th>
                    <th>Dirección</th>
                    <th>Vehículo</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Importe</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((reserva) => {
                    const textoVehiculo = reserva.vehiculo
                      ? `${reserva.vehiculo.matricula}${reserva.vehiculo.marca ? ` (${reserva.vehiculo.marca} ${reserva.vehiculo.modelo || ''})` : ''}`
                      : '—';
                    const precioFormateado = reserva.precioTotal != null
                      ? `${Number(reserva.precioTotal).toFixed(2)} €`
                      : '—';

                    return (
                      <tr key={reserva.id}>
                        <td>#{reserva.id}</td>
                        {tipo === 'recibidas' && (
                          <td>
                            {reserva.usuario
                              ? `${reserva.usuario.nombre} (${reserva.usuario.correo})`
                              : `Usuario #${reserva.usuarioId}`}
                          </td>
                        )}
                        <td>
                          <strong>
                            {reserva.plaza?.titulo || `Plaza #${reserva.plazaId}`}
                          </strong>
                        </td>
                        <td>{reserva.plaza?.direccion || '—'}</td>
                        <td>
                          <span style={{ fontWeight: reserva.vehiculo ? 600 : 400 }}>
                            {textoVehiculo}
                          </span>
                        </td>
                        <td>{new Date(reserva.fechaInicio).toLocaleString('es-ES', {timeZone:'Europe/Madrid', timeZoneName:'short'})}</td>
                        <td>{new Date(reserva.fechaFin).toLocaleString('es-ES', {timeZone:'Europe/Madrid', timeZoneName:'short'})}</td>
                        <td>
                          <strong style={{ color: reserva.precioTotal != null ? 'var(--color-primary)' : 'inherit' }}>
                            {precioFormateado}
                          </strong>
                        </td>
                        <td>
                          {tipo === 'recibidas' && reserva.estado === 'PENDIENTE' ? <>
                            <button type="button" className="btn btn-secondary btn-sm" disabled={enviando} aria-expanded={abierta === reserva.id}
                              onClick={() => { setAbierta(abierta === reserva.id ? null : reserva.id); setRechazando(false); setMotivo(''); }}>
                              Reservada · Pendiente de respuesta ▾
                            </button>
                            {abierta === reserva.id && <fieldset disabled={enviando} className="form-group">
                              <legend>Responder a la solicitud</legend>
                              {rechazando ? <>
                                <label>Motivo del rechazo (opcional)
                                  <textarea value={motivo} maxLength={500} onChange={e => setMotivo(e.target.value)} />
                                </label>
                                <button type="button" className="btn btn-primary" onClick={() => responder(reserva.id, 'RECHAZADA')}>Confirmar rechazo</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setRechazando(false)}>Volver</button>
                              </> : <>
                                <button type="button" className="btn btn-primary" onClick={() => responder(reserva.id, 'CONFIRMADA')}>Aceptar</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setRechazando(true)}>Rechazar</button>
                              </>}
                            </fieldset>}
                          </> : <span className={obtenerClaseBadgeEstado(reserva.estado)}>{tipo === 'recibidas' && reserva.estado === 'CONFIRMADA' ? 'Reservada' : formatearEstadoReserva(reserva.estado)}</span>}
                          {reserva.estado === 'RECHAZADA' && reserva.motivoRechazo && <p>Motivo: {reserva.motivoRechazo}</p>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {metaPaginacion && (
              <Paginacion
                meta={metaPaginacion}
                alCambiarPagina={handleCambiarPagina}
                alCambiarLimite={handleCambiarLimite}
                cargando={cargando}
                etiquetaRecursos="reservas"
              />
            )}
          </>
        )}
      </section>
    </div>
  );
};
