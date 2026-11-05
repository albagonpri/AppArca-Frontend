import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Plaza } from '../models/plaza.model';
import type { PaginacionMeta } from '../models/paginacion.model';
import { obtenerMisFavoritos } from '../services/favoritos.service';
import { TarjetaPlaza } from '../components/plazas/TarjetaPlaza';
import { ModalDetallePlaza } from '../components/plazas/ModalDetallePlaza';
import { Paginacion } from '../components/comun/Paginacion';
import { useFavoritos } from '../context/useFavoritos';

export const Favoritos: React.FC = () => {
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [limitePorPagina, setLimitePorPagina] = useState<number>(10);
  const [metaPaginacion, setMetaPaginacion] = useState<PaginacionMeta | null>(null);
  const [plazaDetalleId, setPlazaDetalleId] = useState<number | null>(null);

  const { favoritosIds } = useFavoritos();

  const cargarFavoritos = useCallback(
    async (pagina = paginaActual, limite = limitePorPagina) => {
      try {
        setCargando(true);
        setError(null);
        const res = await obtenerMisFavoritos({ page: pagina, limit: limite });
        setPlazas(res.data);
        setMetaPaginacion(res.meta);
        setPaginaActual(res.meta.page);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar tus plazas favoritas.',
        );
      } finally {
        setCargando(false);
      }
    },
    [paginaActual, limitePorPagina],
  );

  useEffect(() => {
    void cargarFavoritos();
  }, [cargarFavoritos]);

  const handleCambioPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
    void cargarFavoritos(nuevaPagina, limitePorPagina);
  };

  const handleCambioLimite = (nuevoLimite: number) => {
    setLimitePorPagina(nuevoLimite);
    setPaginaActual(1);
    void cargarFavoritos(1, nuevoLimite);
  };

  // Filtrar plazas en cliente si fueron desmarcadas mientras la vista está abierta
  const plazasVisibles = plazas.filter((p) => favoritosIds.has(p.id));

  return (
    <div className="favoritos-pagina">
      <header className="page-header">
        <h1 className="page-title">Mis favoritos</h1>
        <p className="page-subtitle">
          Plazas de aparcamiento que has guardado para consultar o reservar rápidamente
        </p>
      </header>

      {error && (
        <div className="mensaje-alerta mensaje-error" role="alert">
          {error}
        </div>
      )}

      {cargando && (
        <p className="loading-text">Cargando tus plazas favoritas...</p>
      )}

      {!cargando && plazasVisibles.length === 0 && (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❤️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
            Aún no tienes plazas guardadas en favoritos
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            Explora el mapa y el buscador de plazas en la página de inicio, y pulsa sobre el icono de corazón en cualquier plaza para guardarla aquí.
          </p>
          <Link to="/" className="btn btn-primary">
            Explorar plazas en el mapa
          </Link>
        </div>
      )}

      {!cargando && plazasVisibles.length > 0 && (
        <>
          <div className="plazas-grid">
            {plazasVisibles.map((plaza) => (
              <TarjetaPlaza
                key={plaza.id}
                plaza={plaza}
                onVer={(id) => setPlazaDetalleId(id)}
              />
            ))}
          </div>

          {metaPaginacion && metaPaginacion.totalPages > 1 && (
            <div style={{ marginTop: 'var(--spacing-lg)' }}>
              <Paginacion
                meta={metaPaginacion}
                alCambiarPagina={handleCambioPagina}
                alCambiarLimite={handleCambioLimite}
                opcionesLimite={[10, 20, 50]}
              />
            </div>
          )}
        </>
      )}

      {/* Modal accesible de detalle de plaza mediante React Portal */}
      {plazaDetalleId !== null && (
        <ModalDetallePlaza
          plazaId={plazaDetalleId}
          onCerrar={() => setPlazaDetalleId(null)}
        />
      )}
    </div>
  );
};
