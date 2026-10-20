import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix: leaflet usa rutas absolutas para sus iconos por defecto, que Vite no resuelve bien.
// Importamos manualmente los assets de Leaflet incluidos en node_modules.
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

// Parche global del icono por defecto de Leaflet para Vite/ESM
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconPng,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowPng,
});

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

  return (
    <div className="mapa-ubicacion-wrapper" style={{ height: altura, width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer
        center={centroInicial}
        zoom={zoomInicial}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {coordenadas && (
          <>
            <CentrarMapa coords={coordenadas} />
            <Marker
              position={[coordenadas.latitud, coordenadas.longitud]}
              draggable={interactivo}
              eventHandlers={
                interactivo
                  ? {
                      dragend(e) {
                        const latlng = (e.target as L.Marker).getLatLng();
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

        <ManejadorClic onChange={onChange} habilitado={interactivo} />
      </MapContainer>
    </div>
  );
};
