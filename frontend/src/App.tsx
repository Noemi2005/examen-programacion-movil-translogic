import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { VehiculosView } from './components/VehiculosView';
import { VehiculoFormView } from './components/VehiculoFormView';
import { VehiculoEficienciaView } from './components/VehiculoEficienciaView';
import { VehiculoDetalleView } from './components/VehiculoDetalleView';
import { ServiciosView } from './components/ServiciosView';
import { ServicioFormView } from './components/ServicioFormView';
import { ServicioAsignarView } from './components/ServicioAsignarView';
import { FacturacionView } from './components/FacturacionView';
import { FacturaFormView } from './components/FacturaFormView';
import { ConsultasView } from './components/ConsultasView';
import { ConsultaDetalleView } from './components/ConsultaDetalleView';
import { Footer } from './components/Footer';
import { Usuario } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [initialized, setInitialized] = useState(false);

  // Parámetros de ruta
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string | null>(null);
  const [selectedServicioId, setSelectedServicioId] = useState<string | null>(null);
  const [selectedConsultaKey, setSelectedConsultaKey] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('translogic_user');
    const token = localStorage.getItem('translogic_token');
    if (savedUser && token) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('translogic_user');
        localStorage.removeItem('translogic_token');
      }
    }
    setInitialized(true);
  }, []);

  const handleLoginSuccess = (user: Usuario, _token: string) => {
    setCurrentUser(user);
    setCurrentRoute('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('translogic_token');
    localStorage.removeItem('translogic_user');
    setCurrentUser(null);
  };

  if (!initialized) {
    return null;
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F3F5FA] flex flex-col font-display text-[#13235B]">
      <Navbar
        activeTab={currentRoute.split('-')[0]}
        setActiveTab={(tab) => {
          setCurrentRoute(tab);
          setSelectedVehiculoId(null);
          setSelectedServicioId(null);
          setSelectedConsultaKey(null);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Rutas de Dashboard */}
        {currentRoute === 'dashboard' && <DashboardView />}

        {/* Rutas de Vehículos */}
        {currentRoute === 'vehiculos' && (
          <VehiculosView
            currentUser={currentUser}
            onNavigateToCreate={() => setCurrentRoute('vehiculos-nuevo')}
            onNavigateToEdit={(id) => {
              setSelectedVehiculoId(id);
              setCurrentRoute('vehiculos-editar');
            }}
            onNavigateToEfficiency={(id) => {
              setSelectedVehiculoId(id);
              setCurrentRoute('vehiculos-eficiencia');
            }}
            onNavigateToDetail={(id) => {
              setSelectedVehiculoId(id);
              setCurrentRoute('vehiculos-detalle');
            }}
          />
        )}
        {currentRoute === 'vehiculos-detalle' && selectedVehiculoId && (
          <VehiculoDetalleView
            vehiculoId={selectedVehiculoId}
            onBack={() => setCurrentRoute('vehiculos')}
            onNavigateToEfficiency={(id) => {
              setSelectedVehiculoId(id);
              setCurrentRoute('vehiculos-eficiencia');
            }}
            onNavigateToEdit={(id) => {
              setSelectedVehiculoId(id);
              setCurrentRoute('vehiculos-editar');
            }}
          />
        )}
        {currentRoute === 'vehiculos-nuevo' && (
          <VehiculoFormView
            onBack={() => setCurrentRoute('vehiculos')}
            onSuccess={() => setCurrentRoute('vehiculos')}
          />
        )}
        {currentRoute === 'vehiculos-editar' && selectedVehiculoId && (
          <VehiculoFormView
            vehiculoIdToEdit={selectedVehiculoId}
            onBack={() => setCurrentRoute('vehiculos')}
            onSuccess={() => setCurrentRoute('vehiculos')}
          />
        )}
        {currentRoute === 'vehiculos-eficiencia' && selectedVehiculoId && (
          <VehiculoEficienciaView
            vehiculoId={selectedVehiculoId}
            onBack={() => setCurrentRoute('vehiculos')}
          />
        )}

        {/* Rutas de Servicios */}
        {currentRoute === 'servicios' && (
          <ServiciosView
            currentUser={currentUser}
            onNavigateToCreate={() => setCurrentRoute('servicios-nuevo')}
            onNavigateToAssign={(id) => {
              setSelectedServicioId(id);
              setCurrentRoute('servicios-asignar');
            }}
          />
        )}
        {currentRoute === 'servicios-nuevo' && (
          <ServicioFormView
            onBack={() => setCurrentRoute('servicios')}
            onSuccess={() => setCurrentRoute('servicios')}
          />
        )}
        {currentRoute === 'servicios-asignar' && selectedServicioId && (
          <ServicioAsignarView
            servicioId={selectedServicioId}
            onBack={() => setCurrentRoute('servicios')}
            onSuccess={() => setCurrentRoute('servicios')}
          />
        )}

        {/* Rutas de Facturación */}
        {currentRoute === 'facturacion' && (
          <FacturacionView
            currentUser={currentUser}
            onNavigateToCreate={() => setCurrentRoute('facturacion-nueva')}
          />
        )}
        {currentRoute === 'facturacion-nueva' && (
          <FacturaFormView
            onBack={() => setCurrentRoute('facturacion')}
            onSuccess={() => setCurrentRoute('facturacion')}
          />
        )}

        {/* Rutas de Consultas Avanzadas */}
        {currentRoute === 'consultas' && (
          <ConsultasView
            onSelectConsulta={(key) => {
              setSelectedConsultaKey(key);
              setCurrentRoute('consultas-detalle');
            }}
          />
        )}
        {currentRoute === 'consultas-detalle' && selectedConsultaKey && (
          <ConsultaDetalleView
            consultaKey={selectedConsultaKey}
            onBack={() => setCurrentRoute('consultas')}
          />
        )}
      </main>

      <Footer
        onNavigate={(tab) => {
          setCurrentRoute(tab);
          setSelectedVehiculoId(null);
          setSelectedServicioId(null);
          setSelectedConsultaKey(null);
        }}
      />
    </div>
  );
};

export default App;
