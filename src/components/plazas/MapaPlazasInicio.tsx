import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MarcadorPlazaMapa } from '../../models/plaza.model';
import { CapaMapaBase } from '../mapa/CapaMapaBase';
import { crearIconoPlaza, crearIconoUsuario } from '../mapa/iconosMapa';
import { ControlMiUbicacion } from '../mapa/ControlMiUbicacion';
import { useGeolocalizacionUsuario } from '../../hooks/useGeolocalizacionUsuario';

interface Props {
  marcadores: MarcadorPlazaMapa[];
  cargando?: boolean;
  onSeleccionarPlaza: (plazaId: number) => void;
  altura?: string;
}

/**
 * Subcomponente interno para ajustar automáticamente el encuadre inicial del mapa
 * según las plazas existentes, sin interferir cuando el usuario centra su ubicación.
 */
const AjustarEncuadreMapa: React.FC<{
  marcadores: MarcadorPlazaMapa[];
  ignorarAjuste: boolean;
  onCambioMarcadores: () => void;
}> = ({ marcadores, ignorarAjuste, onCambioMarcadores }) => {
  const mapa = useMap();
  const ultimosMarcadoresRef = useRef<string>('');

  useEffect(() => {
    // Comprobamos si la lista de marcadores ha cambiado realmente (ej. por nuevos filtros de búsqueda)
    const hashActual = marcadores.map((m) => `${m.id}-${m.latitud}-${m.longitud}`).join('|');
    const haCambiado = hashActual !== ultimosMarcadoresRef.current && ultimosMarcadoresRef.current !== '';
    ultimosMarcadoresRef.current = hashActual;

    if (haCambiado) {
      onCambioMarcadores();
    }

    if (ignorarAjuste && !haCambiado) {
      return;
    }

    if (!marcadores || marcadores.length === 0) {
      mapa.setView([40.416775, -3.70379], 6);
      return;
    }

    const marcadoresValidos = marcadores.filter(
      (m) =>
        typeof m.latitud === 'number' &&
        typeof m.longitud === 'number' &&
        !isNaN(m.latitud) &&
        !isNaN(m.longitud),
    );

    if (marcadoresValidos.length === 0) {
      mapa.setView([40.416775, -3.70379], 6);
      return;
    }

    if (marcadoresValidos.length === 1) {
      mapa.setView([marcadoresValidos[0].latitud, marcadoresValidos[0].longitud], 14, {
        animate: true,
      });
      return;
    }

    const bounds = L.latLngBounds(
      marcadoresValidos.map((m) => [m.latitud, m.longitud] as [number, number]),
    );

    mapa.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 15,
      animate: true,
    });
  }, [marcadores, ignorarAjuste, onCambioMarcadores, mapa]);

  return null;
};

/**
 * Subcomponente interno para cerrar cualquier popup abierto de Leaflet al abrir el modal de detalles
 */
const ControladorCierrePopup: React.FC<{ trigger: number }> = ({ trigger }) => {
  const mapa = useMap();
  useEffect(() => {
    if (trigger > 0) {
      mapa.closePopup();
    }
  }, [trigger, mapa]);
  return null;
};

/**
 * Controlador de centrado y detección de interacción manual:
 * - Centra suavemente en las coordenadas del usuario al pulsar «Mi ubicación».
 * - Detecta si el usuario desplaza o amplía manualmente el mapa para evitar recentrados involuntarios.
 */
const ControladorCentradoUsuario: React.FC<{
  coordenadas: { latitud: number; longitud: number } | null;
  solicitudRecentrar: number;
  onInteraccionManual: () => void;
}> = ({ coordenadas, solicitudRecentrar, onInteraccionManual }) => {
  const mapa = useMap();
  const ultimaSolicitudRef = useRef<number>(0);

  // Escuchar eventos de interacción manual del usuario en el mapa
  useMapEvents({
    dragstart() {
      onInteraccionManual();
    },
    zoomstart(e) {
      // Ignorar si el zoom fue provocado por el recentrado programático
      if ((e as unknown as { originalEvent?: Event }).originalEvent) {
        onInteraccionManual();
      }
    },
  });

  useEffect(() => {
    if (solicitudRecentrar > ultimaSolicitudRef.current && coordenadas) {
      ultimaSolicitudRef.current = solicitudRecentrar;
      mapa.flyTo([coordenadas.latitud, coordenadas.longitud], 15, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [solicitudRecentrar, coordenadas, mapa]);

  return null;
};

export const MapaPlazasInicio: React.FC<Props> = ({
  marcadores,
  cargando = false,
  onSeleccionarPlaza,
  altura = '440px',
}) => {
  const centroPorDefecto: [number, number] = [40.416775, -3.70379];
  const zoomPorDefecto = 6;

  // Hook de geolocalización del usuario con solicitud automática al entrar
  const {
    coordenadas: coordsUsuario,
    cargando: cargandoGeo,
    error: errorGeo,
    obtenerUbicacion,
    limpiarError,
  } = useGeolocalizacionUsuario({ solicitarAutomaticamente: true });

  // Contador de peticiones explícitas para recentrar el mapa
  const [solicitudRecentrar, setSolicitudRecentrar] = useState<number>(0);
  // Estado que indica si la vista del mapa está activamente fijada en la ubicación del usuario
  const [ubicacionCentradaActiva, setUbicacionCentradaActiva] = useState<boolean>(false);
  // Trigger para cerrar popups activos al abrir el modal
  const [triggerCerrarPopup, setTriggerCerrarPopup] = useState<number>(0);

  // Centrado automático al obtener las coordenadas por primera vez
  const yaCentradoInicialRef = useRef<boolean>(false);

  useEffect(() => {
    if (coordsUsuario && !yaCentradoInicialRef.current) {
      yaCentradoInicialRef.current = true;
      setSolicitudRecentrar((prev) => prev + 1);
      setUbicacionCentradaActiva(true);
    }
  }, [coordsUsuario]);

  // Filtrado para evitar marcadores con coordenadas corruptas o duplicadas
  const marcadoresUnicos = useMemo(() => {
    const mapaIds = new Set<number>();
    return marcadores.filter((m) => {
      if (
        mapaIds.has(m.id) ||
        typeof m.latitud !== 'number' ||
        typeof m.longitud !== 'number' ||
        isNaN(m.latitud) ||
        isNaN(m.longitud)
      ) {
        return false;
      }
      mapaIds.add(m.id);
      return true;
    });
  }, [marcadores]);

  // Manejador del botón «Mi ubicación»
  const handlePulsarMiUbicacion = useCallback(async () => {
    // Si ya disponemos de las coordenadas, recentramos inmediatamente
    if (coordsUsuario) {
      setSolicitudRecentrar((prev) => prev + 1);
      setUbicacionCentradaActiva(true);
      return;
    }

    // Si aún no se han obtenido, solicitamos permisos al navegador (modo no silencioso para mostrar feedback)
    const coords = await obtenerUbicacion({ silencioso: false });
    if (coords) {
      setSolicitudRecentrar((prev) => prev + 1);
      setUbicacionCentradaActiva(true);
    }
  }, [coordsUsuario, obtenerUbicacion]);

  // Si el usuario mueve el mapa manualmente, desactivamos el recentrado automático
  const handleInteraccionManual = useCallback(() => {
    setUbicacionCentradaActiva(false);
  }, []);

  // Si cambian los marcadores de búsqueda, permitimos que el mapa reencuadre los nuevos resultados
  const handleCambioMarcadores = useCallback(() => {
    setUbicacionCentradaActiva(false);
  }, []);

  return (
    <div
      className="mapa-inicio-contenedor"
      style={{
        position: 'relative',
        width: '100%',
        height: altura,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 16px rgba(15, 61, 86, 0.08)',
        marginBottom: 'var(--spacing-lg)',
      }}
    >
      <MapContainer
        center={centroPorDefecto}
        zoom={zoomPorDefecto}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Capa base moderna (MapTiler Streets si hay API key, o CARTO Voyager estilo Google Maps) */}
        <CapaMapaBase />

        {/* Ajuste de encuadre inicial para mostrar las plazas disponibles */}
        <AjustarEncuadreMapa
          marcadores={marcadoresUnicos}
          ignorarAjuste={ubicacionCentradaActiva}
          onCambioMarcadores={handleCambioMarcadores}
        />

        {/* Controlador para cerrar popups activos al abrir modal de detalles */}
        <ControladorCierrePopup trigger={triggerCerrarPopup} />

        {/* Controlador para recentrar en el usuario cuando pulsa el botón */}
        <ControladorCentradoUsuario
          coordenadas={coordsUsuario}
          solicitudRecentrar={solicitudRecentrar}
          onInteraccionManual={handleInteraccionManual}
        />

        {/* ── Marcador y radio de precisión de la ubicación del usuario ── */}
        {coordsUsuario && (
          <>
            <Marker
              position={[coordsUsuario.latitud, coordsUsuario.longitud]}
              icon={crearIconoUsuario()}
              zIndexOffset={1000}
            >
              <Popup className="popup-mapa-usuario">
                <div style={{ textAlign: 'center', padding: '0.2rem' }}>
                  <strong style={{ display: 'block', color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                    📍 Tu ubicación actual
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Precisión estimada: ±{coordsUsuario.precision} m
                  </span>
                </div>
              </Popup>
            </Marker>

            {/* Círculo de precisión del navegador */}
            <Circle
              center={[coordsUsuario.latitud, coordsUsuario.longitud]}
              radius={coordsUsuario.precision}
              pathOptions={{
                color: '#1A73E8',
                fillColor: '#1A73E8',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />
          </>
        )}

        {/* ── Marcadores de plazas de aparcamiento disponibles ── */}
        {marcadoresUnicos.map((plaza) => (
          <Marker
            key={`marcador-plaza-${plaza.id}`}
            position={[plaza.latitud, plaza.longitud]}
            icon={crearIconoPlaza({
              tieneCargador: plaza.tieneCargadorElectrico,
              estaCubierta: plaza.estaCubierta,
            })}
          >
            <Popup className="popup-mapa-plaza">
              <div style={{ minWidth: '220px', padding: '0.25rem' }}>
                <h4
                  style={{
                    margin: '0 0 0.35rem 0',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                  }}
                >
                  {plaza.titulo}
                </h4>

                <p
                  style={{
                    margin: '0 0 0.4rem 0',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  📍 {plaza.zona || 'Ubicación disponible'}
                </p>

                <div
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    marginBottom: '0.45rem',
                  }}
                >
                  {plaza.precioHora
                    ? plaza.precioHora.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : '0,00'}{' '}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                    €/hora
                  </span>
                </div>

                {/* Etiquetas de características */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.25rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  {plaza.estaCubierta && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                      }}
                    >
                      Cubierta
                    </span>
                  )}
                  {plaza.tieneCargadorElectrico && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: '#ECFDF5',
                        color: '#047857',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                      }}
                    >
                      ⚡ Cargador
                    </span>
                  )}
                  {plaza.tieneCamaras && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                      }}
                    >
                      📹 Cámaras
                    </span>
                  )}
                  {plaza.entradaDificil && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: '#FEF3C7',
                        color: '#B45309',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                      }}
                    >
                      ⚠️ Acceso difícil
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', textAlign: 'center' }}
                  onClick={() => {
                    setTriggerCerrarPopup((prev) => prev + 1);
                    onSeleccionarPlaza(plaza.id);
                  }}
                >
                  Ver detalles
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Botón flotante «Mi ubicación» */}
        <ControlMiUbicacion
          cargando={cargandoGeo}
          activo={ubicacionCentradaActiva}
          onSolicitarUbicacion={handlePulsarMiUbicacion}
          posicion="bottomright"
        />
      </MapContainer>

      {/* Indicador flotante superior con el total de plazas */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          border: '1px solid var(--color-border)',
        }}
      >
        <span>🗺️</span>
        <span>
          {marcadoresUnicos.length === 1
            ? '1 plaza en el mapa'
            : `${marcadoresUnicos.length} plazas en el mapa`}
        </span>
      </div>

      {/* Notificación informativa flotante si ocurre un error o denegación de geolocalización */}
      {errorGeo && (
        <div
          className="mapa-aviso-geo"
          role="alert"
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '60px',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderLeft: '4px solid var(--color-warning, #f59e0b)',
            borderRadius: '6px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            padding: '0.5rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            fontSize: '0.82rem',
            color: 'var(--color-text-main)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>ℹ️</span>
            <span>{errorGeo}</span>
          </div>
          <button
            type="button"
            onClick={limpiarError}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              color: 'var(--color-text-muted)',
              padding: '0 0.25rem',
              lineHeight: 1,
            }}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}

      {/* Indicador de carga transparente sobre el mapa */}
      {cargando && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            padding: '0.3rem 0.65rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          }}
        >
          Actualizando mapa...
        </div>
      )}
    </div>
  );
};
