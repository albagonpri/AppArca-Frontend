import React, { useState, useEffect } from 'react';
import type { Reserva } from '../models/reserva.model';
import type { PaginacionMeta } from '../models/paginacion.model';
import { obtenerReservas } from '../services/reservas.service';
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
  }, [tipo, filtroEstado, paginaActual, limitePorPagina]);

  const handleCambiarTipo = (nuevoTipo: 'propias' | 'recibidas') => {
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

  const obtenerClaseEstado = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'CONFIRMADA':
      case 'COMPLETADA':
        return 'badge badge-success';
      case 'PENDIENTE':
        return 'badge badge-warning';
      case 'CANCELADA':
        return 'badge badge-danger';
      default:
        return 'badge badge-neutral';
    }
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
              Reservas recibidas en mis plazas
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
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((reserva) => (
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
                      <td>{new Date(reserva.fechaInicio).toLocaleString('es-ES')}</td>
                      <td>{new Date(reserva.fechaFin).toLocaleString('es-ES')}</td>
                      <td>
                        <span className={obtenerClaseEstado(reserva.estado)}>
                          {reserva.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
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
