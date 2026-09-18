import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Inicio } from './pages/Inicio';
import { MiPlaza } from './pages/MiPlaza';
import { MisReservas } from './pages/MisReservas';
import { MiPerfil } from './pages/MiPerfil';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/mi-plaza" element={<MiPlaza />} />
            <Route path="/mis-reservas" element={<MisReservas />} />
            <Route path="/mi-perfil" element={<MiPerfil />} />

            {/* Redirecciones de compatibilidad */}
            <Route path="/usuarios" element={<Navigate to="/mi-perfil" replace />} />
            <Route path="/plazas" element={<Navigate to="/mi-plaza" replace />} />
            <Route path="/reservas" element={<Navigate to="/mis-reservas" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
