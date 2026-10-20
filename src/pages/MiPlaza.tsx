import React, { useState, useEffect, useCallback } from 'react';
import type { Plaza } from '../models/plaza.model';
import type { PaginacionMeta } from '../models/paginacion.model';
import { obtenerMisPlazas, eliminarPlaza } from '../services/plazas.service';
import { FormularioPlaza } from '../components/plazas/FormularioPlaza';
import { TarjetaPlaza } from '../components/plazas/TarjetaPlaza';
import { DetallePlaza } from '../components/plazas/DetallePlaza';
import { Paginacion } from '../components/comun/Paginacion';

export const MiPlaza: React.FC = () => {
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [limitePorPagina, setLimitePorPagina] = useState<number>(10);
  const [metaPaginacion, setMetaPaginacion] = useState<PaginacionMeta | null>(null);

  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);
  const [plazaAEditar, setPlazaAEditar] = useState<Plaza | null>(null);
  const [plazaAEliminar, setPlazaAEliminar] = useState<Plaza | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);
  const [plazaDetalleId, setPlazaDetalleId] = useState<number | null>(null);

  const recargarPlazas = useCallback(
    async (pagina = paginaActual, limite = limitePorPagina) => {
      try {
        setCargando(true);
        setError(null);
        const res = await obtenerMisPlazas({ page: pagina, limit: limite });
        setPlazas(res.data);
        setMetaPaginacion(res.meta);
        setPaginaActual(res.meta.page);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar tus plazas publicadas.',
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
        const res = await obtenerMisPlazas({
          page: paginaActual,
          limit: limitePorPagina,
        });
        if (isMounted) {
          setPlazas(res.data);
          setMetaPaginacion(res.meta);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar tus plazas publicadas.',
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
    setPlazaAEditar(null);
    setMostrarFormulario(true);
    setExito(null);
    setError(null);
  };

  const handleIniciarEdicion = (plaza: Plaza) => {
    setPlazaAEditar(plaza);
    setMostrarFormulario(true);
    setExito(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
    setPlazaAEditar(null);
  };

  const handleExitoFormulario = async (mensaje: string) => {
    setMostrarFormulario(false);
    setPlazaAEditar(null);
    setExito(mensaje);
    await recargarPlazas(1, limitePorPagina);
  };

  const handleSolicitarEliminar = (plaza: Plaza) => {
    setPlazaAEliminar(plaza);
  };

  const handleCancelarEliminar = () => {
    setPlazaAEliminar(null);
  };

  const handleConfirmarEliminar = async () => {
    if (!plazaAEliminar) return;

    try {
      setEliminando(true);
      setError(null);
      const tituloEliminado = plazaAEliminar.titulo;
      await eliminarPlaza(plazaAEliminar.id);
      setExito(`Plaza "${tituloEliminado}" eliminada correctamente.`);
      setPlazaAEliminar(null);

      // Si se elimina el último registro de una página > 1, retroceder a la página anterior
      const paginaDestino =
        plazas.length === 1 && paginaActual > 1 ? paginaActual - 1 : paginaActual;

      if (paginaDestino !== paginaActual) {
        setPaginaActual(paginaDestino);
      } else {
        await recargarPlazas(paginaDestino, limitePorPagina);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('No se pudo eliminar la plaza seleccionada.');
      }
    } finally {
      setEliminando(false);
    }
  };

  const handleVerPlaza = (id: number) => {
    setPlazaDetalleId(id);
  };

  const handleCerrarDetalle = () => {
    setPlazaDetalleId(null);
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Mis plazas</h1>
        <p className="page-subtitle">
          Gestión y publicación de tus plazas de aparcamiento
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
            {plazaAEditar
              ? `Editar plaza: ${plazaAEditar.titulo}`
              : 'Publicar nueva plaza'}
          </h2>
          <FormularioPlaza
            key={plazaAEditar ? `edit-${plazaAEditar.id}` : 'crear-nueva'}
            plazaAEditar={plazaAEditar}
            onExito={handleExitoFormulario}
            onCancelar={handleCancelarFormulario}
          />
        </section>
      )}

      {/* Listado principal de mis plazas */}
      <section className="page-section">
        <div className="section-header-row">
          <h2 className="section-title" style={{ margin: 0, borderBottom: 'none' }}>
            Mis Plazas Publicadas
          </h2>
          {!mostrarFormulario && (
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={handleIniciarCreacion}
            >
              + Publicar plaza
            </button>
          )}
        </div>

        {cargando && (
          <p className="loading-text">Cargando tus plazas...</p>
        )}

        {!cargando && plazas.length === 0 && (
          <div className="plazas-vacio">
            <p className="empty-text">Todavía no has publicado ninguna plaza.</p>
            {!mostrarFormulario && (
              <button
                type="button"
                className="btn btn-accent"
                onClick={handleIniciarCreacion}
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                Publicar una plaza
              </button>
            )}
          </div>
        )}

        {!cargando && plazas.length > 0 && (
          <>
            <div className="plazas-grid">
              {plazas.map((plaza) => (
                <TarjetaPlaza
                  key={plaza.id}
                  plaza={plaza}
                  onVer={handleVerPlaza}
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
                etiquetaRecursos="plazas"
              />
            )}
          </>
        )}
      </section>

      {/* Modal de detalle de la plaza */}
      {plazaDetalleId !== null && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-detalle-plaza-titulo"
        >
          <div
            className="modal-content"
            style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <DetallePlaza
              plazaId={plazaDetalleId}
              onCerrar={handleCerrarDetalle}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar plaza */}
      {plazaAEliminar && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-eliminar-plaza-titulo"
        >
          <div className="modal-content">
            <h3 id="modal-eliminar-plaza-titulo" className="modal-titulo">
              Eliminar plaza
            </h3>
            <p className="modal-mensaje">
              ¿Estás seguro de que deseas eliminar la plaza{' '}
              <strong>{plazaAEliminar.titulo}</strong> ({plazaAEliminar.direccion})?
              Esta acción no se puede deshacer y cancelará las disponibilidades asociadas.
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
