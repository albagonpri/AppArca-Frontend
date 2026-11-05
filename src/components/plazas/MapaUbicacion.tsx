import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapContainer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CapaMapaBase } from '../mapa/CapaMapaBase';
import { crearIconoGaraje } from '../mapa/iconosMapa';
import { ControlMiUbicacion } from '../mapa/ControlMiUbicacion';
import { useGeolocalizacionUsuario } from '../../hooks/useGeolocalizacionUsuario';

export interface CoordenadasMapa {
  latitud: number;
  longitud: number;
}

interface CentrarMapaProps {
  coords: CoordenadasMapa;
  zoom?: number;
}

/** Subcomponente interno: centra el mapa cuando cambian las coordenadas externas. */
const CentrarMapa: React.FC<CentrarMapaProps> = ({ coords, zoom = 17 }) => {
  const mapa = useMap();
  const prevRef = useRef<CoordenadasMapa | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (
      !prev ||
      prev.latitud !== coords.latitud ||
      prev.longitud !== coords.longitud
    ) {
      mapa.setView([coords.latitud, coords.longitud], zoom, { animate: true });
      prevRef.current = coords;
    }
  }, [coords, zoom, mapa]);

  return null;
};

interface ManejadorClicProps {
  onChange: (coords: CoordenadasMapa) => void;
  habilitado: boolean;
}

/** Subcomponente interno: escucha clics en el mapa y llama a onChange. */
const ManejadorClic: React.FC<ManejadorClicProps> = ({ onChange, habilitado }) => {
  useMapEvents({
    click(e) {
      if (!habilitado) return;
      onChange({
        latitud: Math.round(e.latlng.lat * 1e6) / 1e6,
        longitud: Math.round(e.latlng.lng * 1e6) / 1e6,
      });
    },
  });
  return null;
};

interface MapaUbicacionProps {
  /** Coordenadas del marcador actual. Si es null, no se muestra marcador. */
  coordenadas: CoordenadasMapa | null;
  /** Se llama cuando el usuario mueve el marcador o hace clic en el mapa. */
  onChange: (coords: CoordenadasMapa) => void;
  /** Si false, el mapa es de solo lectura (sin clic ni arrastre). */
  interactivo?: boolean;
  /** Altura del mapa. Por defecto 320px. */
  altura?: string;
}

export const MapaUbicacion: React.FC<MapaUbicacionProps> = ({
  coordenadas,
  onChange,
  interactivo = true,
  altura = '320px',
}) => {
  // Centro inicial: España (si no hay coords aún)
  const centroInicial: [number, number] = coordenadas
    ? [coordenadas.latitud, coordenadas.longitud]
    : [40.416775, -3.70379];

  const zoomInicial = coordenadas ? 17 : 6;

  // Hook de geolocalización para facilitar situar el garaje en la posición actual
  const {
    cargando: cargandoGeo,
    error: errorGeo,
    obtenerUbicacion,
    limpiarError,
  } = useGeolocalizacionUsuario();

  const [ubicacionUsuarioActiva, setUbicacionUsuarioActiva] = useState(false);

  const handleMiUbicacion = useCallback(async () => {
    const coords = await obtenerUbicacion();
    if (coords) {
      setUbicacionUsuarioActiva(true);
      onChange({
        latitud: Math.round(coords.latitud * 1e6) / 1e6,
        longitud: Math.round(coords.longitud * 1e6) / 1e6,
      });
    }
  }, [obtenerUbicacion, onChange]);

  return (
    <div
      className="mapa-ubicacion-wrapper"
      style={{
        position: 'relative',
        height: altura,
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 8px rgba(15, 61, 86, 0.06)',
      }}
    >
      <MapContainer
        center={centroInicial}
        zoom={zoomInicial}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Capa base moderna (MapTiler Streets / CARTO Voyager) */}
        <CapaMapaBase />

        {coordenadas && (
          <>
            <CentrarMapa coords={coordenadas} />
            <Marker
              position={[coordenadas.latitud, coordenadas.longitud]}
              draggable={interactivo}
              icon={crearIconoGaraje()}
              eventHandlers={
                interactivo
                  ? {
                      dragstart() {
                        setUbicacionUsuarioActiva(false);
                      },
                      dragend(e) {
                        const latlng = (e.target as L.Marker).getLatLng();
                        setUbicacionUsuarioActiva(false);
                        onChange({
                          latitud: Math.round(latlng.lat * 1e6) / 1e6,
                          longitud: Math.round(latlng.lng * 1e6) / 1e6,
                        });
                      },
                    }
                  : {}
              }
            />
          </>
        )}

        <ManejadorClic
          onChange={(coords) => {
            setUbicacionUsuarioActiva(false);
            onChange(coords);
          }}
          habilitado={interactivo}
        />

        {interactivo && (
          <ControlMiUbicacion
            cargando={cargandoGeo}
            activo={ubicacionUsuarioActiva}
            onSolicitarUbicacion={handleMiUbicacion}
            posicion="bottomright"
          />
        )}
      </MapContainer>

      {/* Aviso flotante si ocurre un error de geolocalización */}
      {errorGeo && (
        <div
          className="mapa-aviso-geo"
          role="alert"
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '55px',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderLeft: '4px solid var(--color-warning, #f59e0b)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            padding: '0.45rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.4rem',
            fontSize: '0.78rem',
            color: 'var(--color-text-main)',
          }}
        >
          <span>ℹ️ {errorGeo}</span>
          <button
            type="button"
            onClick={limpiarError}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1,
            }}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
