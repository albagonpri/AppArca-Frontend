import React, { useState, useEffect, useCallback } from 'react';
import type { Vehiculo } from '../models/vehiculo.model';
import type { PaginacionMeta } from '../models/paginacion.model';
import { obtenerVehiculos, eliminarVehiculo } from '../services/vehiculos.service';
import { TarjetaVehiculo } from '../components/vehiculos/TarjetaVehiculo';
import { FormularioVehiculo } from '../components/vehiculos/FormularioVehiculo';
import { Paginacion } from '../components/comun/Paginacion';

export const MisVehiculos: React.FC = () => {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [limitePorPagina, setLimitePorPagina] = useState<number>(10);
  const [metaPaginacion, setMetaPaginacion] = useState<PaginacionMeta | null>(null);

  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);
  const [vehiculoAEditar, setVehiculoAEditar] = useState<Vehiculo | null>(null);
  const [vehiculoAEliminar, setVehiculoAEliminar] = useState<Vehiculo | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  const formatearNombreVehiculo = (v: Vehiculo): string => {
    const marcaOModelo = [v.marca, v.modelo]
      .map((s) => s?.trim())
      .filter(Boolean)
      .join(' ');
    return marcaOModelo || v.matricula;
  };

  const recargarVehiculos = useCallback(
    async (pagina = paginaActual, limite = limitePorPagina) => {
      try {
        setCargando(true);
        setError(null);
        const res = await obtenerVehiculos({ page: pagina, limit: limite });
        setVehiculos(res.data);
        setMetaPaginacion(res.meta);
        setPaginaActual(res.meta.page);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los vehículos registrados.',
        );
      } finally {
        setCargando(false);
      }
    },
    [paginaActual, limitePorPagina],
  );

  useEffect(() => {
    let isMounted = true;

    const cargar = async () => {
      try {
        setError(null);
        setCargando(true);
        const res = await obtenerVehiculos({
          page: paginaActual,
          limit: limitePorPagina,
        });
        if (isMounted) {
          setVehiculos(res.data);
          setMetaPaginacion(res.meta);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar los vehículos registrados.',
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
  }, [paginaActual, limitePorPagina]);

  const handleCambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCambiarLimite = (nuevoLimite: number) => {
    setLimitePorPagina(nuevoLimite);
    setPaginaActual(1);
  };

  const handleIniciarCreacion = () => {
    setVehiculoAEditar(null);
    setMostrarFormulario(true);
    setExito(null);
    setError(null);
  };

  const handleIniciarEdicion = (vehiculo: Vehiculo) => {
    setVehiculoAEditar(vehiculo);
    setMostrarFormulario(true);
    setExito(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
    setVehiculoAEditar(null);
  };

  const handleExitoFormulario = async (mensaje: string) => {
    setMostrarFormulario(false);
    setVehiculoAEditar(null);
    setExito(mensaje);
    await recargarVehiculos(1, limitePorPagina);
  };

  const handleSolicitarEliminar = (vehiculo: Vehiculo) => {
    setVehiculoAEliminar(vehiculo);
  };

  const handleCancelarEliminar = () => {
    setVehiculoAEliminar(null);
  };

  const handleConfirmarEliminar = async () => {
    if (!vehiculoAEliminar) return;

    try {
      setEliminando(true);
      setError(null);
      const nombreEliminado = formatearNombreVehiculo(vehiculoAEliminar);
      await eliminarVehiculo(vehiculoAEliminar.id);
      setExito(`Vehículo ${nombreEliminado} eliminado correctamente.`);
      setVehiculoAEliminar(null);

      // Si se elimina el último registro de una página > 1, retroceder de página
      const paginaDestino =
        vehiculos.length === 1 && paginaActual > 1 ? paginaActual - 1 : paginaActual;

      if (paginaDestino !== paginaActual) {
        setPaginaActual(paginaDestino);
      } else {
        await recargarVehiculos(paginaDestino, limitePorPagina);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('No se pudo eliminar el vehículo.');
      }
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Mis vehículos</h1>
        <p className="page-subtitle">
          Gestiona tus vehículos registrados para aparcamiento y reservas
        </p>
      </header>

      {exito && (
        <div className="mensaje-alerta mensaje-exito" role="status">
          {exito}
        </div>
      )}

      {error && (
        <div className="mensaje-alerta mensaje-error" role="alert">
          {error}
        </div>
      )}

      {/* Formulario de creación o edición */}
      {mostrarFormulario && (
        <section className="page-section">
          <h2 className="section-title">
            {vehiculoAEditar
              ? `Editar vehículo: ${formatearNombreVehiculo(vehiculoAEditar)}`
              : 'Registrar nuevo vehículo'}
          </h2>
          <FormularioVehiculo
            key={vehiculoAEditar ? `edit-${vehiculoAEditar.id}` : 'crear-nuevo'}
            vehiculoAEditar={vehiculoAEditar}
            onExito={handleExitoFormulario}
            onCancelar={handleCancelarFormulario}
          />
        </section>
      )}

      {/* Listado principal de vehículos */}
      <section className="page-section">
        <div className="section-header-row">
          <h2 className="section-title" style={{ margin: 0, borderBottom: 'none' }}>
            Vehículos registrados
          </h2>
          {!mostrarFormulario && (
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={handleIniciarCreacion}
            >
              + Añadir vehículo
            </button>
          )}
        </div>

        {cargando && (
          <p className="loading-text">Cargando tus vehículos...</p>
        )}

        {!cargando && vehiculos.length === 0 && (
          <div className="vehiculos-vacio">
            <p className="empty-text">No tienes ningún vehículo registrado.</p>
            {!mostrarFormulario && (
              <button
                type="button"
                className="btn btn-accent"
                onClick={handleIniciarCreacion}
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                Añadir vehículo
              </button>
            )}
          </div>
        )}

        {!cargando && vehiculos.length > 0 && (
          <>
            <div className="vehiculos-grid">
              {vehiculos.map((vehiculo) => (
                <TarjetaVehiculo
                  key={vehiculo.id}
                  vehiculo={vehiculo}
                  onEditar={handleIniciarEdicion}
                  onEliminar={handleSolicitarEliminar}
                />
              ))}
            </div>

            {metaPaginacion && (
              <Paginacion
                meta={metaPaginacion}
                alCambiarPagina={handleCambiarPagina}
                alCambiarLimite={handleCambiarLimite}
                cargando={cargando}
                etiquetaRecursos="vehículos"
              />
            )}
          </>
        )}
      </section>

      {/* Modal de confirmación para eliminar vehículo */}
      {vehiculoAEliminar && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-eliminar-titulo"
        >
          <div className="modal-content">
            <h3 id="modal-eliminar-titulo" className="modal-titulo">
              Eliminar vehículo
            </h3>
            <p className="modal-mensaje">
              ¿Estás seguro de que deseas eliminar el vehículo{' '}
              <strong>{formatearNombreVehiculo(vehiculoAEliminar)}</strong>
              {vehiculoAEliminar.matricula &&
              vehiculoAEliminar.matricula !==
                formatearNombreVehiculo(vehiculoAEliminar)
                ? ` (${vehiculoAEliminar.matricula})`
                : ''}
              ? Esta acción no se puede deshacer.
            </p>
            <div className="modal-acciones">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelarEliminar}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
