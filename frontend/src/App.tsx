import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { VehiculosView } from './components/VehiculosView';
import { ServiciosView } from './components/ServiciosView';
import { FacturacionView } from './components/FacturacionView';
import { ConsultasAvanzadasView } from './components/ConsultasAvanzadasView';
import { Usuario } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initialized, setInitialized] = useState(false);

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
    setActiveTab('dashboard');
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'vehiculos' && <VehiculosView currentUser={currentUser} />}
        {activeTab === 'servicios' && <ServiciosView currentUser={currentUser} />}
        {activeTab === 'facturacion' && <FacturacionView currentUser={currentUser} />}
        {activeTab === 'consultas' && <ConsultasAvanzadasView />}
      </main>
    </div>
  );
};

export default App;
