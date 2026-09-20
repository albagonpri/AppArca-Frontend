import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Inicio } from './pages/Inicio';
import { MiPlaza } from './pages/MiPlaza';
import { MisReservas } from './pages/MisReservas';
import { MiPerfil } from './pages/MiPerfil';
import { IniciarSesion } from './pages/IniciarSesion';
import { Registro } from './pages/Registro';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';

const RutaProtegida: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return null;
  }

  if (!autenticado) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return <>{children}</>;
};

const RutaPublicaAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return null;
  }

  if (autenticado) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route
                path="/iniciar-sesion"
                element={
                  <RutaPublicaAuth>
                    <IniciarSesion />
                  </RutaPublicaAuth>
                }
              />
              <Route
                path="/registro"
                element={
                  <RutaPublicaAuth>
                    <Registro />
                  </RutaPublicaAuth>
                }
              />
              <Route
                path="/mi-plaza"
                element={
                  <RutaProtegida>
                    <MiPlaza />
                  </RutaProtegida>
                }
              />
              <Route
                path="/mis-reservas"
                element={
                  <RutaProtegida>
                    <MisReservas />
                  </RutaProtegida>
                }
              />
              <Route
                path="/mi-perfil"
                element={
                  <RutaProtegida>
                    <MiPerfil />
                  </RutaProtegida>
                }
              />

              {/* Redirecciones de compatibilidad */}
              <Route path="/usuarios" element={<Navigate to="/mi-perfil" replace />} />
              <Route path="/plazas" element={<Navigate to="/mi-plaza" replace />} />
              <Route path="/reservas" element={<Navigate to="/mis-reservas" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
