import { useState, useEffect, useCallback } from 'react';

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
const CLAVE_SOLICITADA_SESION = 'apparca_geo_solicitada_sesion';
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
              sessionStorage.setItem(CLAVE_SOLICITADA_SESION, 'true');
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

  // Monitorizar cambios en el estado de permisos y ejecutar solicitud automática si procede
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return;
    }

    let permissionStatus: PermissionStatus | null = null;

    if ('permissions' in navigator && typeof navigator.permissions?.query === 'function') {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          permissionStatus = status;
          setPermiso(status.state as EstadoPermisoUbicacion);
          status.onchange = () => {
            setPermiso(status.state as EstadoPermisoUbicacion);
            if (status.state === 'granted') {
              void obtenerUbicacion({ silencioso: true });
            } else if (status.state === 'denied') {
              try {
                sessionStorage.setItem(CLAVE_RECHAZADA_SESION, 'true');
              } catch {
                // Ignorar
              }
            }
          };
        })
        .catch(() => {
          // Ignorar
        });
    }

    // Comprobar si se debe ejecutar la solicitud automática al montar el componente
    if (solicitarAutomaticamente) {
      if (coordsEnMemoria) {
        return;
      }

      let fueRechazada = false;
      let fueSolicitada = false;
      try {
        fueRechazada = sessionStorage.getItem(CLAVE_RECHAZADA_SESION) === 'true';
        fueSolicitada = sessionStorage.getItem(CLAVE_SOLICITADA_SESION) === 'true';
      } catch {
        // Ignorar
      }

      // Si el usuario rechazó explícitamente en esta visita, no volver a solicitar automáticamente
      if (fueRechazada) {
        return;
      }

      // Si no se ha solicitado en esta visita, solicitar automáticamente de forma silenciosa
      if (!fueSolicitada) {
        try {
          sessionStorage.setItem(CLAVE_SOLICITADA_SESION, 'true');
        } catch {
          // Ignorar
        }
        void obtenerUbicacion({ silencioso: true });
      } else {
        // Si ya fue solicitada y el permiso del navegador ya está concedido, recuperar coordenadas
        if ('permissions' in navigator && typeof navigator.permissions?.query === 'function') {
          navigator.permissions
            .query({ name: 'geolocation' })
            .then((status) => {
              if (status.state === 'granted') {
                void obtenerUbicacion({ silencioso: true });
              }
            })
            .catch(() => {
              // Ignorar
            });
        }
      }
    }

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
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
