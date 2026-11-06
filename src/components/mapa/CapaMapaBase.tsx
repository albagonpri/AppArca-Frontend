import React, { useState } from 'react';
import { TileLayer } from 'react-leaflet';

interface CapaMapaBaseProps {
  maxZoom?: number;
}

export const CapaMapaBase: React.FC<CapaMapaBaseProps> = ({ maxZoom = 20 }) => {
  const apiKeyCarto = import.meta.env.VITE_CARTO_API_KEY?.trim();
  const apiKeyMapTiler = import.meta.env.VITE_MAPTILER_API_KEY?.trim();

  // En caso de que alguna clave falle durante la carga, se conmuta a OpenStreetMap
  const [usarFallbackOSM, setUsarFallbackOSM] = useState<boolean>(false);

  // 1. CARTO Voyager (solo si existe una clave válida configurada)
  if (!usarFallbackOSM && apiKeyCarto) {
    return (
      <TileLayer
        key="carto-voyager-autenticado"
        url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${apiKeyCarto}`}
        subdomains="abcd"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'
        maxZoom={maxZoom}
        eventHandlers={{
          tileerror: () => {
            // Si la clave expira o falla la red de CARTO, conmutar inmediatamente a OSM
            setUsarFallbackOSM(true);
          },
        }}
      />
    );
  }

  // 2. MapTiler Streets (solo si existe una clave válida configurada)
  if (!usarFallbackOSM && apiKeyMapTiler) {
    return (
      <TileLayer
        key="maptiler-streets-autenticado"
        url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${apiKeyMapTiler}`}
        attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
        maxZoom={Math.min(maxZoom, 19)}
        eventHandlers={{
          tileerror: () => {
            setUsarFallbackOSM(true);
          },
        }}
      />
    );
  }

  if (!usarFallbackOSM) {
    return (
      <TileLayer
        key="ign-callejero"
        url="https://www.ign.es/wmts/ign-base?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=IGNBaseTodo&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg"
        attribution='&copy; <a href="https://www.ign.es/">Instituto Geográfico Nacional</a>'
        maxNativeZoom={19}
        maxZoom={maxZoom}
        eventHandlers={{ tileerror: () => setUsarFallbackOSM(true) }}
      />
    );
  }

  return (
    <TileLayer
      key="osm-estandar"
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
      maxZoom={Math.min(maxZoom, 19)}
    />
  );
};
