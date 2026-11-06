import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Plaza, FiltrosPlazasConsulta, MarcadorPlazaMapa } from '../models/plaza.model';
import type { PaginacionMeta } from '../models/paginacion.model';
import { obtenerPlazas, obtenerMarcadoresMapa } from '../services/plazas.service';
import { TarjetaPlaza } from '../components/plazas/TarjetaPlaza';
import { ModalDetallePlaza } from '../components/plazas/ModalDetallePlaza';
import { Paginacion } from '../components/comun/Paginacion';
import { BarraBusquedaPlazas } from '../components/plazas/BarraBusquedaPlazas';
import { MapaPlazasInicio } from '../components/plazas/MapaPlazasInicio';

export const Inicio: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [marcadoresMapa, setMarcadoresMapa] = useState<MarcadorPlazaMapa[]>([]);
  const [metaPaginacion, setMetaPaginacion] = useState<PaginacionMeta | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargandoMapa, setCargandoMapa] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros aplicados actualmente a la consulta
  const [filtros, setFiltros] = useState<FiltrosPlazasConsulta>({
    page: 1,
    limit: 9,
  });

  // Modal para ver el detalle de una plaza seleccionada
  const [plazaDetalleId, setPlazaDetalleId] = useState<number | null>(null);

  const isMountedRef = useRef<boolean>(true);

  // Comprobar si se especificó una plaza en la URL (ej. tras redirección de inicio de sesión)
  useEffect(() => {
    const plazaIdParam = searchParams.get('plazaId');
    if (plazaIdParam) {
      const id = parseInt(plazaIdParam, 10);
      if (!isNaN(id)) {
        setPlazaDetalleId(id);
      }
    }
  }, [searchParams]);

  const cargarDatos = useCallback(async (filtrosConsulta: FiltrosPlazasConsulta) => {
    try {
      setCargando(true);
      setCargandoMapa(true);
      setError(null);

      // Carga en paralelo del listado paginado y de todos los marcadores del mapa que cumplen los filtros
      const [resPlazas, resMarcadores] = await Promise.all([
        obtenerPlazas(filtrosConsulta),
        obtenerMarcadoresMapa(filtrosConsulta),
      ]);

      if (isMountedRef.current) {
        setPlazas(resPlazas.data);
        setMetaPaginacion(resPlazas.meta);
        setMarcadoresMapa(resMarcadores);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las plazas disponibles.',
        );
      }
    } finally {
      if (isMountedRef.current) {
        setCargando(false);
        setCargandoMapa(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void cargarDatos(filtros);

    return () => {
      isMountedRef.current = false;
    };
  }, [filtros, cargarDatos]);

  const handleBuscar = (nuevosFiltros: FiltrosPlazasConsulta) => {
    setFiltros({
      ...nuevosFiltros,
      page: 1,
      limit: filtros.limit,
    });
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      page: 1,
      limit: filtros.limit,
    });
  };

  const handleCambiarPagina = (nuevaPagina: number) => {
    setFiltros((prev) => ({
      ...prev,
      page: nuevaPagina,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCambiarLimite = (nuevoLimite: number) => {
    setFiltros((prev) => ({
      ...prev,
      limit: nuevoLimite,
      page: 1,
    }));
  };

  const handleCerrarDetalle = () => {
    setPlazaDetalleId(null);
    if (searchParams.has('plazaId')) {
      searchParams.delete('plazaId');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const hayFiltrosActivos = Boolean(
    filtros.q ||
      filtros.provincia ||
      filtros.municipio ||
      filtros.codigoPostal ||
      filtros.estaCubierta !== undefined ||
      filtros.tieneCargadorElectrico !== undefined ||
      filtros.tieneCamaras !== undefined ||
      filtros.entradaDificil !== undefined ||
      filtros.largoMin !== undefined ||
      filtros.anchoMin !== undefined ||
      filtros.precioMin !== undefined ||
      filtros.precioMax !== undefined,
  );

  return (
    <div className="inicio-container">
      {/* ── Parte Superior: Encabezado y Barra de Búsqueda con Filtros ── */}
      <header className="page-header" style={{ marginBottom: 'var(--spacing-md)' }}>
        <h1 className="page-title">Encuentra tu plaza de aparcamiento</h1>
      </header>

      <BarraBusquedaPlazas
        filtrosAplicados={filtros}
        onBuscar={handleBuscar}
        onLimpiar={handleLimpiarFiltros}
        cargando={cargando}
      />

      {error && (
        <div className="mensaje-alerta mensaje-error" role="alert">
          {error}
        </div>
      )}

      {/* Resumen de resultados y chips de filtros aplicados */}
      <div className="resultados-plazas-resumen">
        <div className="contador-resultados">
          {cargando ? (
            <span>Buscando plazas...</span>
          ) : metaPaginacion ? (
            <span>
              Mostrando <strong>{plazas.length}</strong> de{' '}
              <strong>{metaPaginacion.total}</strong> plaza
              {metaPaginacion.total === 1 ? '' : 's'} disponible
              {metaPaginacion.total === 1 ? '' : 's'}
              {filtros.q ? ` para "${filtros.q}"` : ''}
            </span>
          ) : (
            <span>{plazas.length} plazas encontradas</span>
          )}
        </div>

        {hayFiltrosActivos && (
          <div className="chips-filtros-activos">
            {filtros.q && (
              <span className="chip-filtro-activo">📍 Ubicación: {filtros.q}</span>
            )}
            {filtros.provincia && (
              <span className="chip-filtro-activo">Provincia: {filtros.provincia}</span>
            )}
            {filtros.municipio && (
              <span className="chip-filtro-activo">Municipio: {filtros.municipio}</span>
            )}
            {filtros.codigoPostal && (
              <span className="chip-filtro-activo">CP: {filtros.codigoPostal}</span>
            )}
            {filtros.estaCubierta !== undefined && (
              <span className="chip-filtro-activo">
                Cubierta: {filtros.estaCubierta ? 'Sí' : 'No'}
              </span>
            )}
            {filtros.tieneCargadorElectrico !== undefined && (
              <span className="chip-filtro-activo">
                Cargador: {filtros.tieneCargadorElectrico ? 'Sí' : 'No'}
              </span>
            )}
            {filtros.tieneCamaras !== undefined && (
              <span className="chip-filtro-activo">
                Cámaras: {filtros.tieneCamaras ? 'Sí' : 'No'}
              </span>
            )}
            {filtros.entradaDificil !== undefined && (
              <span className="chip-filtro-activo">
                Entrada difícil: {filtros.entradaDificil ? 'Sí' : 'No'}
              </span>
            )}
            {filtros.largoMin !== undefined && (
              <span className="chip-filtro-activo">Largo ≥ {filtros.largoMin}m</span>
            )}
            {filtros.anchoMin !== undefined && (
              <span className="chip-filtro-activo">Ancho ≥ {filtros.anchoMin}m</span>
            )}
            {filtros.precioMax !== undefined && (
              <span className="chip-filtro-activo">Precio ≤ {filtros.precioMax}€/h</span>
            )}
          </div>
        )}
      </div>

      {/* ── Parte Central: Mapa Interactivo con las Plazas Disponibles ── */}
      <section className="inicio-mapa-seccion" aria-label="Mapa interactivo de plazas">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
            Mapa de plazas disponibles
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Haz clic en un marcador para consultar la plaza
          </span>
        </div>
        <MapaPlazasInicio
          marcadores={marcadoresMapa}
          cargando={cargandoMapa}
          onSeleccionarPlaza={(id) => setPlazaDetalleId(id)}
          altura="420px"
        />
      </section>

      {/* ── Parte Inferior: Listado de Tarjetas y Paginación ── */}
      <section className="page-section" style={{ marginTop: 0 }} aria-label="Listado de plazas">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--spacing-md)', color: 'var(--color-primary)' }}>
          Listado de plazas
        </h2>

        {cargando && (
          <p className="loading-text">Cargando plazas disponibles...</p>
        )}

        {!cargando && plazas.length === 0 && (
          <div className="plazas-vacio" style={{ padding: 'var(--spacing-xl) 0' }}>
            <p className="empty-text" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
              No se han encontrado plazas que coincidan con los criterios seleccionados.
            </p>
            <p className="form-hint" style={{ marginTop: '0.25rem' }}>
              Prueba a cambiar la ubicación en la barra de búsqueda o a relajar los filtros aplicados.
            </p>
            {hayFiltrosActivos && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLimpiarFiltros}
                style={{ marginTop: 'var(--spacing-md)' }}
              >
                Limpiar filtros de búsqueda
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
                  onVer={(id) => setPlazaDetalleId(id)}
                  onReservar={(p) => setPlazaDetalleId(p.id)}
                />
              ))}
            </div>

            {metaPaginacion && (
              <Paginacion
                meta={metaPaginacion}
                alCambiarPagina={handleCambiarPagina}
                alCambiarLimite={handleCambiarLimite}
                cargando={cargando}
                etiquetaRecursos="plazas disponibles"
              />
            )}
          </>
        )}
      </section>

      {/* Modal de detalle de la plaza seleccionada mediante Portal */}
      {plazaDetalleId !== null && (
        <ModalDetallePlaza
          plazaId={plazaDetalleId}
          onCerrar={handleCerrarDetalle}
        />
      )}
    </div>
  );
};
export default Inicio;
