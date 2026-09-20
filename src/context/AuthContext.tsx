import React, { useState, useEffect } from 'react';
import { obtenerToken, validarSesion, eliminarToken } from '../services/auth.service';
import { AuthContext } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autenticado, setAutenticado] = useState<boolean>(() => !!obtenerToken());
  const [cargando, setCargando] = useState<boolean>(() => !!obtenerToken());

  useEffect(() => {
    let isMounted = true;

    const ejecutarVerificacion = async () => {
      if (window.location.search.includes('logout=true')) {
        eliminarToken();
        if (isMounted) {
          setAutenticado(false);
          setCargando(false);
        }
        return false;
      }

      const token = obtenerToken();
      if (!token) {
        if (isMounted) {
          setAutenticado(false);
          setCargando(false);
        }
        return false;
      }

      const valido = await validarSesion();
      if (isMounted) {
        setAutenticado(valido);
        setCargando(false);
      }
      return valido;
    };

    if (obtenerToken()) {
      void ejecutarVerificacion();
    }

    const handleAuthChange = () => {
      void ejecutarVerificacion();
    };

    window.addEventListener('apparca_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener('apparca_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const verificarSesionManual = async () => {
    const valido = await validarSesion();
    setAutenticado(valido);
    setCargando(false);
    return valido;
  };

  return (
    <AuthContext.Provider
      value={{
        autenticado,
        cargando,
        verificarSesion: verificarSesionManual,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
