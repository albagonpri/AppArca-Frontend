import { instantesMadrid } from '../../models/horaMadrid';
import { franjasDelDia, horaTexto } from '../../models/horario';

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Plaza } from '../../models/plaza.model';
import { obtenerEtiquetaDificultad } from '../../models/plaza.model';
import type { Reserva } from '../../models/reserva.model';
import type { Vehiculo } from '../../models/vehiculo.model';
import { obtenerPlazaPorId, obtenerReservasPlaza } from '../../services/plazas.service';
import { crearReserva, consultarDisponibilidad } from '../../services/reservas.service';
import { obtenerVehiculos } from '../../services/vehiculos.service';
import { useAuth } from '../../context/useAuth';
import { obtenerUsuarioSesion } from '../../services/auth.service';
import { BotonFavorito } from './BotonFavorito';
import { GaleriaFotosPlaza } from './GaleriaFotosPlaza';

interface Props {
  plazaId: number;
  onCerrar: () => void;
  abrirReservaDirecta?: boolean;
}

export const DetallePlaza: React.FC<Props> = ({
  plazaId,
  onCerrar,
  abrirReservaDirecta = false,
}) => {
  const { autenticado } = useAuth();
  const navigate = useNavigate();
  const usuarioSesion = obtenerUsuarioSesion();

  const [plaza, setPlaza] = useState<Plaza | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del flujo de reserva
  const [mostrarFormularioReserva, setMostrarFormularioReserva] = useState<boolean>(abrirReservaDirecta);
  const [mostrarAvisoLogin, setMostrarAvisoLogin] = useState<boolean>(false);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [exitoReserva, setExitoReserva] = useState<string | null>(null);
  const [inicioRepetido, setInicioRepetido] = useState(0);
  const [finRepetido, setFinRepetido] = useState(0);
  const inicios = instantesMadrid(fechaInicio);
  const finales = instantesMadrid(fechaFin);
  const inicioISO = inicios[inicioRepetido]?.toISOString() ?? '';
  const finISO = finales[finRepetido]?.toISOString() ?? '';
  const clave = [plazaId,inicioISO,finISO].join('/');
  const [consulta, setConsulta] = useState({clave:'', disponible:false, mensaje:''});

  // Vehículos del usuario para asociar a la reserva
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [vehiculoSeleccionadoId, setVehiculoSeleccionadoId] = useState<number | null>(null);
  const [cargandoVehiculos, setCargandoVehiculos] = useState<boolean>(false);

  useEffect(() => {
    if (!autenticado || !mostrarFormularioReserva) return;
    let activo = true;
    const cargarVehiculosUsuario = async () => {
      try {
        setCargandoVehiculos(true);
        const res = await obtenerVehiculos({ limit: 100 });
        if (activo) {
          setVehiculos(res.data);
          if (res.data.length > 0) {
            setVehiculoSeleccionadoId(res.data[0].id);
          }
        }
      } catch {
        // Ignorar fallo al cargar vehículos
      } finally {
        if (activo) setCargandoVehiculos(false);
      }
    };
    void cargarVehiculosUsuario();
    return () => {
      activo = false;
    };
  }, [autenticado, mostrarFormularioReserva]);

  // Cálculo en tiempo real del precio total según horas y minutos
  const calculoPrecio = (() => {
    if (!inicioISO || !finISO || !plaza) return null;
    const ini = new Date(inicioISO);
    const fin = new Date(finISO);
    if (isNaN(ini.getTime()) || isNaN(fin.getTime()) || ini >= fin) return null;
    const duracionMs = fin.getTime() - ini.getTime();
    const duracionHoras = duracionMs / (1000 * 60 * 60);
    const horasEnteras = Math.floor(duracionHoras);
    const minutosRestantes = Math.round((duracionHoras - horasEnteras) * 60);
    const total = Math.round(plaza.precioHora * duracionHoras * 100) / 100;
    return {
      duracionHoras,
      horasEnteras,
      minutosRestantes,
      total,
      totalFormateado: total.toFixed(2),
    };
  })();
  useEffect(() => {
    if (exitoReserva || !mostrarFormularioReserva || !autenticado || !inicioISO || !finISO) return;
    const control = new AbortController();
    let secuencia = 0;
    const comprobar = async () => {
      const actual = ++secuencia;
      try {
        await consultarDisponibilidad(plazaId, inicioISO, finISO, control.signal);
        if (actual === secuencia && !control.signal.aborted)
          setConsulta({clave, disponible:true, mensaje:'Horario disponible'});
      } catch (error) {
        if (actual === secuencia && !control.signal.aborted)
          setConsulta({clave, disponible:false, mensaje:error instanceof Error ? error.message : 'No se pudo consultar la disponibilidad.'});
      }
    };
    void comprobar();
    window.addEventListener('focus', comprobar);
    const intervalo = window.setInterval(comprobar, 15000);
    return () => {
      control.abort();
      window.clearInterval(intervalo);
      window.removeEventListener('focus', comprobar);
    };
  }, [plazaId,inicioISO,finISO,clave,mostrarFormularioReserva,autenticado,exitoReserva]);
  const periodoDisponible = consulta.clave === clave && consulta.disponible;
  const [guardandoReserva, setGuardandoReserva] = useState<boolean>(false);
  const [errorReserva, setErrorReserva] = useState<string | null>(null);


  useEffect(() => {
    let activo = true;

    const cargarDetalles = async () => {
      try {
        setCargando(true);
        setError(null);

        // Obtenemos los datos de la plaza mediante el endpoint público
        const plazaData = await obtenerPlazaPorId(plazaId);
        let reservasData: Reserva[] = [];

        // Las reservas de la plaza solo están autorizadas para el propietario o administrador
        if (autenticado) {
          try {
            const res = await obtenerReservasPlaza(plazaId);
            reservasData = res.data;
          } catch {
            // Si el usuario no es el propietario, se ignoran las reservas y se muestran los detalles
          }
        }

        if (activo) {
          setPlaza(plazaData);
          setReservas(reservasData);
        }
      } catch (err: unknown) {
        if (activo) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Error al obtener la información de la plaza.');
          }
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarDetalles();

    return () => {
      activo = false;
    };
  }, [plazaId, autenticado]);

  const handleClicReservar = () => {
    if (!autenticado) {
      setMostrarAvisoLogin(true);
      return;
    }
    setMostrarFormularioReserva(true);
    setMostrarAvisoLogin(false);
  };

  const handleConfirmarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorReserva(null);
    setExitoReserva(null);

    if (!periodoDisponible || !fechaInicio || !fechaFin) {
      setErrorReserva('Por favor, selecciona las fechas y horas de inicio y fin.');
      return;
    }

    const inicioDate = new Date(inicioISO);
    const finDate = new Date(finISO);

    if (isNaN(inicioDate.getTime()) || isNaN(finDate.getTime())) {
      setErrorReserva('Las fechas introducidas no son válidas.');
      return;
    }

    if (inicioDate >= finDate) {
      setErrorReserva('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (!usuarioSesion || !usuarioSesion.id) {
      setErrorReserva('Debes iniciar sesión para realizar la reserva.');
      return;
    }

    if (!vehiculoSeleccionadoId) {
      setErrorReserva('Debes seleccionar un vehículo registrado para poder realizar la reserva.');
      return;
    }

    try {
      setGuardandoReserva(true);
      await crearReserva({
        usuarioId: usuarioSesion.id,
        plazaId,
        vehiculoId: vehiculoSeleccionadoId,
        fechaInicio: inicioDate.toISOString(),
        fechaFin: finDate.toISOString(),
      });

      setExitoReserva('¡Reserva creada con éxito! Puedes gestionarla en tu panel de reservas.');
      setFechaInicio('');
      setFechaFin('');
    } catch (err) {
      if (err instanceof Error) {
        setErrorReserva(err.message);
      } else {
        setErrorReserva('Ocurrió un error al procesar tu solicitud de reserva.');
      }
    } finally {
      setGuardandoReserva(false);
    }
  };

  const esPropietario = Boolean(
    autenticado &&
      usuarioSesion &&
      plaza &&
      plaza.propietarioId === usuarioSesion.id,
  );

  return (
    <div className="detalle-container">
      <div className="detalle-header detalle-plaza-header">
        <h3 id="modal-detalle-plaza-titulo" className="detalle-title">Detalle de la Plaza</h3>
        <BotonFavorito plazaId={plazaId} tamano="md" mostrarTexto={true} />
        <button
          type="button"
          className="btn btn-secondary detalle-plaza-cerrar"
          onClick={onCerrar}
          aria-label="Cerrar detalle de la plaza"
          title="Cerrar detalle de la plaza"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      {cargando && <p className="loading-text">Cargando información de la plaza...</p>}
      {error && <div className="mensaje-alerta mensaje-error">{error}</div>}

      {!cargando && !error && plaza && (
        <>
          {/* Galería / Carrusel de fotos de la plaza */}
          <GaleriaFotosPlaza fotos={plaza.fotos} tituloPlaza={plaza.titulo} />

          <div className="detalle-datos">
            <div className="dato-item">
              <span className="dato-label">Título</span>
              <span className="dato-valor">{plaza.titulo}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Dirección</span>
              <span className="dato-valor">{plaza.direccion}</span>
            </div>
            {plaza.numeroPlaza && (
              <div className="dato-item">
                <span className="dato-label">Número de plaza</span>
                <span className="dato-valor">{plaza.numeroPlaza}</span>
              </div>
            )}
            {plaza.planta && (
              <div className="dato-item">
                <span className="dato-label">Planta</span>
                <span className="dato-valor">{plaza.planta}</span>
              </div>
            )}
            <div className="dato-item">
              <span className="dato-label">Precio por hora</span>
              <span className="dato-valor">{plaza.precioHora} €/h</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Disponibilidad</span>
              <span className="dato-valor">
                <span className={`badge ${plaza.disponible ? 'badge-success' : 'badge-danger'}`}>
                  {plaza.disponible ? 'Disponible' : 'No disponible'}
                </span>
              </span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Propietario</span>
              <span className="dato-valor">
                {plaza.propietario
                  ? plaza.propietario.correo
                    ? `${plaza.propietario.nombre} (${plaza.propietario.correo})`
                    : plaza.propietario.nombre
                  : `ID #${plaza.propietarioId}`}
              </span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Dimensiones</span>
              <span className="dato-valor">
                {plaza.largo} m (largo) × {plaza.ancho} m (ancho)
              </span>
            </div>
            {plaza.alturaMaxima != null && (
              <div className="dato-item">
                <span className="dato-label">Altura máxima</span>
                <span className="dato-valor">{plaza.alturaMaxima} m</span>
              </div>
            )}
            <div className="dato-item">
              <span className="dato-label">¿Está cubierta?</span>
              <span className="dato-valor">{plaza.estaCubierta ? 'Sí' : 'No'}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Cargador para vehículos eléctricos</span>
              <span className="dato-valor">{plaza.tieneCargadorElectrico ? 'Sí' : 'No'}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Cámaras de seguridad</span>
              <span className="dato-valor">{plaza.tieneCamaras ? 'Sí' : 'No'}</span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Entrada difícil</span>
              <span className="dato-valor">
                {plaza.entradaDificil ? (
                  <div>
                    <span style={{ fontWeight: 600 }}>Sí</span>
                    {plaza.dificultadesEntrada && plaza.dificultadesEntrada.length > 0 && (
                      <div className="plaza-dificultades-badges">
                        {plaza.dificultadesEntrada.map((dificultad) => (
                          <span
                            key={dificultad}
                            className="badge badge-warning badge-dificultad"
                          >
                            ⚠️ {obtenerEtiquetaDificultad(dificultad)}
                          </span>
                        ))}
                      </div>
                    )}
                    {plaza.descripcionEntrada && (
                      <div
                        className="plaza-dificultad-alerta"
                        style={{ marginTop: '0.4rem' }}
                      >
                        <strong>Detalle:</strong> {plaza.descripcionEntrada}
                      </div>
                    )}
                  </div>
                ) : (
                  'No'
                )}
              </span>
            </div>
            <div className="dato-item">
              <span className="dato-label">Descripción</span>
              <span className="dato-valor">{plaza.descripcion}</span>
            </div>
            {plaza.indicacionesAcceso && (
              <div className="dato-item" style={{ gridColumn: '1 / -1' }}>
                <span className="dato-label">Indicaciones de acceso</span>
                <span className="dato-valor" style={{ whiteSpace: 'pre-line', fontWeight: 500 }}>
                  {plaza.indicacionesAcceso}
                </span>
              </div>
            )}
          </div>

          {/* ── Bloque de Acción: Reservar Plaza ── */}
          <div
            className="seccion-reserva-plaza"
            style={{
              marginTop: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--spacing-sm)',
              }}
            >
              <div>
                <h4 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.05rem', fontWeight: 700 }}>
                  Reserva de plaza
                </h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                  Tarifa: <strong>{plaza.precioHora} €/hora</strong>
                </p>
              </div>

              {plaza.disponible && !mostrarFormularioReserva && !esPropietario && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleClicReservar}
                >
                  Reservar esta plaza
                </button>
              )}

              {esPropietario && (
                <span className="badge badge-neutral" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                  Esta plaza es de tu propiedad
                </span>
              )}
            </div>

            {/* Aviso para visitantes no autenticados */}
            {mostrarAvisoLogin && !autenticado && (
              <div
                className="mensaje-alerta mensaje-info"
                style={{ marginTop: 'var(--spacing-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🔒</span>
                  <strong>Necesitas iniciar sesión para reservar esta plaza.</strong>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                  Inicia sesión o crea tu cuenta gratuita en AppArca para confirmar tu reserva.
                </p>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: '0.25rem' }}>
                  <Link
                    to={`/iniciar-sesion?plazaId=${plaza.id}`}
                    state={{ plazaId: plaza.id }}
                    className="btn btn-primary btn-sm"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to={`/registro?plazaId=${plaza.id}`}
                    state={{ plazaId: plaza.id }}
                    className="btn btn-secondary btn-sm"
                  >
                    Registrarse
                  </Link>
                </div>
              </div>
            )}

            {/* Formulario de reserva para usuario autenticado */}
            {mostrarFormularioReserva && autenticado && !esPropietario && (
              <form onSubmit={handleConfirmarReserva} style={{ marginTop: 'var(--spacing-md)' }}>
                {errorReserva && (
                  <div className="mensaje-alerta mensaje-error" style={{ marginBottom: 'var(--spacing-sm)' }}>
                    {errorReserva}
                  </div>
                )}
                {exitoReserva && (
                  <div className="mensaje-alerta mensaje-exito" style={{ marginBottom: 'var(--spacing-sm)' }}>
                    {exitoReserva}
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/mis-reservas')}
                      >
                        Ver mis reservas
                      </button>
                    </div>
                  </div>
                )}

                {!exitoReserva && (
                  <>
                    {/* Selector de vehículo */}
                    {cargandoVehiculos && (
                      <p className="loading-text" style={{ fontSize: '0.85rem' }}>
                        Cargando tus vehículos...
                      </p>
                    )}

                    {!cargandoVehiculos && vehiculos.length === 0 && (
                      <div
                        className="mensaje-alerta mensaje-warning"
                        style={{ marginBottom: 'var(--spacing-sm)', padding: '0.75rem' }}
                      >
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          ⚠️ No tienes ningún vehículo registrado.
                        </p>
                        <p style={{ margin: '0.25rem 0 0.5rem', fontSize: 'var(--font-size-sm)' }}>
                          Para poder realizar una reserva en AppArca debes asociar al menos uno de tus vehículos.
                        </p>
                        <Link to="/mis-vehiculos" className="btn btn-primary btn-sm">
                          + Añadir mi primer vehículo
                        </Link>
                      </div>
                    )}

                    {!cargandoVehiculos && vehiculos.length > 0 && (
                      <div className="form-group" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        <label htmlFor="reserva-vehiculo" style={{ fontWeight: 600 }}>
                          Vehículo para la reserva <span className="campo-requerido">*</span>
                        </label>
                        <select
                          id="reserva-vehiculo"
                          value={vehiculoSeleccionadoId ?? ''}
                          onChange={(e) => setVehiculoSeleccionadoId(Number(e.target.value))}
                          disabled={guardandoReserva}
                          required
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: '#fff',
                          }}
                        >
                          {vehiculos.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.matricula} {v.marca || v.modelo ? `— ${[v.marca, v.modelo, v.version].filter(Boolean).join(' ')}` : ''}
                            </option>
                          ))}
                        </select>
                        <span className="form-hint">Selecciona el vehículo con el que accederás a la plaza</span>
                      </div>
                    )}

                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="reserva-fecha-inicio">Inicio (hora peninsular)</label>
                        <input
                          id="reserva-fecha-inicio"
                          type="datetime-local"
                          value={fechaInicio}
                          onChange={(e) => { setFechaInicio(e.target.value); setInicioRepetido(0); }}
                          disabled={guardandoReserva}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="reserva-fecha-fin">Fin (hora peninsular)</label>
                        <input
                          id="reserva-fecha-fin"
                          type="datetime-local"
                          value={fechaFin}
                          onChange={(e) => { setFechaFin(e.target.value); setFinRepetido(0); }}
                          disabled={guardandoReserva}
                          required
                        />
                      </div>
                    </div>

                    {inicios.length === 2 && <label>Hora de inicio repetida <select value={inicioRepetido} onChange={e=>setInicioRepetido(Number(e.target.value))}><option value={0}>Primera (verano)</option><option value={1}>Segunda (invierno)</option></select></label>}
                    {finales.length === 2 && <label>Hora de fin repetida <select value={finRepetido} onChange={e=>setFinRepetido(Number(e.target.value))}><option value={0}>Primera (verano)</option><option value={1}>Segunda (invierno)</option></select></label>}
                    {fechaInicio && plaza.horario && <p>Horario del día: {franjasDelDia(plaza.horario,fechaInicio.slice(0,10)).map(f=>horaTexto(f.inicio)+'–'+horaTexto(f.fin)).join(', ') || 'Cerrado'}</p>}
                    <p role="status">{(fechaInicio && !inicioISO) || (fechaFin && !finISO) ? 'Esa hora no existe en España peninsular.' : consulta.clave === clave ? consulta.mensaje : inicioISO && finISO ? 'Comprobando horario…' : ''}</p>

                    {/* Resumen del importe y duración antes de confirmar */}
                    {calculoPrecio && (
                      <div
                        style={{
                          marginTop: 'var(--spacing-xs)',
                          marginBottom: 'var(--spacing-sm)',
                          padding: '0.75rem',
                          backgroundColor: '#EFF6FF',
                          borderRadius: '6px',
                          border: '1px solid #BFDBFE',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.8rem', color: '#1E40AF', display: 'block' }}>
                            Duración de la reserva
                          </span>
                          <strong>
                            {calculoPrecio.horasEnteras > 0 ? `${calculoPrecio.horasEnteras}h ` : ''}
                            {calculoPrecio.minutosRestantes > 0 ? `${calculoPrecio.minutosRestantes}min` : ''}
                            {calculoPrecio.horasEnteras === 0 && calculoPrecio.minutosRestantes === 0 ? 'Menos de 1 min' : ''}
                          </strong>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.8rem', color: '#1E40AF', display: 'block' }}>
                            Precio total estimado ({plaza.precioHora} €/h)
                          </span>
                          <strong style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                            {calculoPrecio.totalFormateado} €
                          </strong>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setMostrarFormularioReserva(false)}
                        disabled={guardandoReserva}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={guardandoReserva || !periodoDisponible || vehiculos.length === 0}
                      >
                        {guardandoReserva ? 'Confirmando...' : 'Confirmar reserva'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>

          {/* Historial de reservas solo para el propietario */}
          {esPropietario && reservas.length > 0 && (
            <div className="subseccion-detalle">
              <h4 className="subseccion-titulo">Reservas recibidas en tu plaza ({reservas.length})</h4>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID Reserva</th>
                      <th>Conductor</th>
                      <th>Fecha de inicio</th>
                      <th>Fecha de fin</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.map((r) => (
                      <tr key={r.id}>
                        <td>#{r.id}</td>
                        <td>
                          {r.usuario
                            ? `${r.usuario.nombre} (#${r.usuario.id})`
                            : `Usuario #${r.usuarioId}`}
                        </td>
                        <td>{new Date(r.fechaInicio).toLocaleString('es-ES', {timeZone:'Europe/Madrid', timeZoneName:'short'})}</td>
                        <td>{new Date(r.fechaFin).toLocaleString('es-ES', {timeZone:'Europe/Madrid', timeZoneName:'short'})}</td>
                        <td>
                          <span className="badge badge-warning">{r.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
