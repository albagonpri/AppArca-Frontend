import L from 'leaflet';

/**
 * Crea el icono visual de una plaza de aparcamiento disponible, alineado con los colores corporativos
 * de AppArca (#0F3D56 y #18B7A0), con sombra suave y distintivo para cargadores eléctricos o plazas cubiertas.
 */
export function crearIconoPlaza(opciones?: {
  tieneCargador?: boolean;
  estaCubierta?: boolean;
}): L.DivIcon {
  const tieneCargador = Boolean(opciones?.tieneCargador);

  const html = `
    <div class="marcador-plaza-contenedor">
      <div class="marcador-plaza-pin">
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <filter id="pin-sombra" x="0" y="0" width="34" height="42" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(15, 61, 86, 0.35)"/>
          </filter>
          <!-- Cuerpo del Pin en Azul Corporativo AppArca -->
          <path d="M17 0C7.611 0 0 7.611 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.611 26.389 0 17 0Z" fill="#0F3D56" filter="url(#pin-sombra)"/>
          <!-- Círculo interior en color de acento Verde/Turquesa AppArca -->
          <circle cx="17" cy="16" r="11.5" fill="#18B7A0"/>
          <!-- Letra P de Parking en blanco -->
          <text x="17" y="21.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="14.5" fill="#FFFFFF" text-anchor="middle">P</text>
        </svg>
        ${
          tieneCargador
            ? `<span class="marcador-badge-cargador" title="Plaza con cargador eléctrico">⚡</span>`
            : ''
        }
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'marcador-div-icono',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  });
}

/**
 * Crea el marcador de ubicación del usuario al estilo Google Maps:
 * Punto azul vibrante (#1A73E8) con borde blanco limpio y un halo exterior pulsante.
 */
export function crearIconoUsuario(): L.DivIcon {
  const html = `
    <div class="marcador-usuario-wrapper" title="Tu ubicación actual">
      <div class="marcador-usuario-pulso"></div>
      <div class="marcador-usuario-punto"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'marcador-div-icono-usuario',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

/**
 * Crea el icono arrastrable para el mapa de edición/creación de plazas, señalando la entrada del garaje.
 */
export function crearIconoGaraje(): L.DivIcon {
  const html = `
    <div class="marcador-garaje-contenedor" title="Entrada del garaje (arrastra para ajustar)">
      <div class="marcador-garaje-pin">
        <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <filter id="garaje-sombra" x="0" y="0" width="36" height="44" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(24, 183, 160, 0.45)"/>
          </filter>
          <path d="M18 0C8.059 0 0 8.059 0 18C0 29.5 18 44 18 44C18 44 36 29.5 36 18C36 8.059 27.941 0 18 0Z" fill="#18B7A0" filter="url(#garaje-sombra)"/>
          <circle cx="18" cy="17" r="12" fill="#0F3D56"/>
          <!-- Icono de garaje/puerta -->
          <path d="M11 20V14.5L18 10L25 14.5V20H11ZM13 18.5H23V15.2L18 12L13 15.2V18.5Z" fill="#FFFFFF"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'marcador-div-icono',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -40],
  });
}

