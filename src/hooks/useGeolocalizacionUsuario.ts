import { useState, useEffect, useCallback, useRef } from 'react';

export interface CoordenadasUsuario {
  latitud: number;
  longitud: number;
  precision: number; // Radio en metros
}

export type EstadoPermisoUbicacion = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface UseGeolocalizacionUsuarioOptions {
  /**
   * Si es true, solicita automáticamente permiso y obtiene la ubicación al montar el componente,
   * siempre que no haya sido rechazada o solicitada previamente en esta visita.
   */
  solicitarAutomaticamente?: boolean;
}

export interface UseGeolocalizacionUsuarioResult {
  coordenadas: CoordenadasUsuario | null;
  cargando: boolean;
  error: string | null;
  permiso: EstadoPermisoUbicacion;
  obtenerUbicacion: (opciones?: { silencioso?: boolean }) => Promise<CoordenadasUsuario | null>;
  limpiarError: () => void;
}

// Caché en memoria a nivel de módulo para conservar las coordenadas entre navegaciones
let coordsEnMemoria: CoordenadasUsuario | null = null;

// Claves de sesión para evitar solicitudes repetidas o insistir si el usuario rechazó el permiso
const CLAVE_RECHAZADA_SESION = 'apparca_geo_rechazada_sesion';

/**
 * Hook para gestionar la geolocalización nativa del navegador en AppArca.
 * - Soporta solicitud automática al entrar en la aplicación o tras iniciar sesión.
 * - Respeta si el usuario ya concedió o denegó el permiso en la visita actual.
 * - Evita solicitudes duplicadas o alertas intrusivas al navegar.
 * - Las coordenadas nunca se envían al backend ni se persisten en base de datos.
 */
export function useGeolocalizacionUsuario(
  options: UseGeolocalizacionUsuarioOptions = {},
): UseGeolocalizacionUsuarioResult {
  const { solicitarAutomaticamente = false } = options;

  const [coordenadas, setCoordenadas] = useState<CoordenadasUsuario | null>(() => coordsEnMemoria);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [permiso, setPermiso] = useState<EstadoPermisoUbicacion>(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return 'unsupported';
    }
    try {
      if (sessionStorage.getItem(CLAVE_RECHAZADA_SESION) === 'true') {
        return 'denied';
      }
    } catch {
      // Ignorar errores en modo incógnito estricto
    }
    return coordsEnMemoria ? 'granted' : 'prompt';
  });

  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  const obtenerUbicacion = useCallback(
    (opciones?: { silencioso?: boolean }): Promise<CoordenadasUsuario | null> => {
      return new Promise((resolve) => {
        if (typeof window === 'undefined' || !('geolocation' in navigator)) {
          const msg = 'Tu navegador o dispositivo no admite geolocalización.';
          if (!opciones?.silencioso) {
            setError(msg);
          }
          setPermiso('unsupported');
          resolve(null);
          return;
        }

        setCargando(true);
        if (!opciones?.silencioso) {
          setError(null);
        }

        const opcionesGeo: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 10000, // 10 segundos máximo
          maximumAge: 30000, // Reutilizar coordenadas frescas de menos de 30s
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const nuevasCoords: CoordenadasUsuario = {
              latitud: position.coords.latitude,
              longitud: position.coords.longitude,
              precision: Math.round(position.coords.accuracy || 20),
            };

            // Guardar en memoria de sesión
            coordsEnMemoria = nuevasCoords;
            try {
              sessionStorage.removeItem(CLAVE_RECHAZADA_SESION);
            } catch {
              // Ignorar
            }

            setCoordenadas(nuevasCoords);
            setPermiso('granted');
            setCargando(false);
            setError(null);
            resolve(nuevasCoords);
          },
          (err) => {
            setCargando(false);
            let mensaje = 'Ocurrió un error al obtener tu ubicación.';

            if (err.code === err.PERMISSION_DENIED) {
              setPermiso('denied');
              try {
                sessionStorage.setItem(CLAVE_RECHAZADA_SESION, 'true');
              } catch {
                // Ignorar
              }
              mensaje =
                'Permiso de ubicación denegado. Puedes seguir explorando y buscando plazas en el mapa manualmente.';
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              mensaje =
                'No se pudo determinar tu ubicación actual. Comprueba la señal GPS o tu conexión a Internet.';
            } else if (err.code === err.TIMEOUT) {
              mensaje =
                'Se agotó el tiempo de espera para obtener la ubicación. Por favor, inténtalo de nuevo.';
            }

            // Solo mostramos el aviso si no es una solicitud silenciosa automática de fondo
            if (!opciones?.silencioso) {
              setError(mensaje);
            }
            resolve(null);
          },
          opcionesGeo,
        );
      });
    },
    [],
  );

  const solicitudInicial = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) return;

    let activo = true;
    let estado: PermissionStatus | undefined;

    const solicitarAlAbrir = (permisoActual?: PermissionState) => {
      if (!solicitarAutomaticamente || coordsEnMemoria || solicitudInicial.current) return;
      if (permisoActual === 'denied') return;
      try {
        if (permisoActual !== 'granted' && sessionStorage.getItem(CLAVE_RECHAZADA_SESION) === 'true') return;
      } catch {
        // El navegador puede restringir el almacenamiento de sesión.
      }
      solicitudInicial.current = true;
      void obtenerUbicacion({ silencioso: true });
    };

    const actualizarPermiso = () => {
      if (!estado) return;
      setPermiso(estado.state);
      if (estado.state === 'granted') void obtenerUbicacion({ silencioso: true });
    };

    const iniciar = async () => {
      try {
        estado = await navigator.permissions?.query({ name: 'geolocation' });
      } catch {
        // Algunos navegadores ofrecen geolocalización sin consulta de permisos.
      }
      if (!activo) return;
      if (estado) {
        setPermiso(estado.state);
        estado.addEventListener('change', actualizarPermiso);
      }
      solicitarAlAbrir(estado?.state);
    };

    void iniciar();
    return () => {
      activo = false;
      estado?.removeEventListener('change', actualizarPermiso);
    };
  }, [solicitarAutomaticamente, obtenerUbicacion]);

  return {
    coordenadas,
    cargando,
    error,
    permiso,
    obtenerUbicacion,
    limpiarError,
  };
}
