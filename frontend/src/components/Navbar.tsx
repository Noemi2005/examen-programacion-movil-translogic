import React from 'react';
import {
  ArrowRight,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Usuario, RolUsuario } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Usuario | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD' },
    { id: 'vehiculos', label: 'VEHÍCULOS' },
    { id: 'servicios', label: 'SERVICIOS' },
    { id: 'facturacion', label: 'FACTURACIÓN' },
    { id: 'consultas', label: 'CONSULTAS' },
  ];

  return (
    <>
      {/* Navbar Superior Blanco */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#D5DAE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Marca Oficial sin Fondo */}
          <div
            className="flex items-center cursor-pointer select-none py-1"
            onClick={() => setActiveTab('dashboard')}
          >
            <img
              src="/logo.png"
              alt="TRANSLOGIC"
              className="h-10 sm:h-11 w-auto object-contain max-w-[220px]"
            />
          </div>

          {/* Enlaces de Navegación Centrales */}
          <nav className="hidden md:flex items-center space-x-6 h-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`h-full flex items-center font-display text-xs font-extrabold tracking-wider transition-all border-b-2 px-1 ${
                    isActive
                      ? 'border-[#13235B] text-[#13235B]'
                      : 'border-transparent text-[#5B6480] hover:text-[#13235B]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Botón CTA + Perfil Usuario */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setActiveTab('servicios-nuevo')}
              className="btn h-9 px-4 text-[11px] font-extrabold tracking-wider bg-[#13235B] hover:bg-[#0D1A4A] text-white flex items-center space-x-1.5 shadow-none"
            >
              <span>NUEVO SERVICIO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {currentUser && (
              <div className="flex items-center space-x-2 pl-2 border-l border-[#D5DAE6]">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="font-mono text-xs font-bold text-[#13235B] leading-none">
                    {currentUser.nombre}
                  </span>
                  <span
                    className={`font-mono text-[9px] font-extrabold px-1 py-0.5 mt-0.5 self-end ${
                      currentUser.rol === RolUsuario.ADMINISTRADOR
                        ? 'bg-[#F5A623] text-[#0D1A4A]'
                        : 'bg-[#2B3C7A] text-white'
                    }`}
                  >
                    {currentUser.rol}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Cerrar Sesión"
                  className="btn-icon btn-icon--secondary"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#13235B]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub-franja Técnica alineada exactamente con el Navbar */}
        <div className="bg-[#FAFBFD] border-t border-b border-[#D5DAE6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-[10px] font-mono text-[#5B6480] uppercase tracking-widest">
            <span>TRANSPORTE Y LOGÍSTICA DE CARGA</span>
            <span>SISTEMA DE GESTIÓN Y FACTURACIÓN</span>
          </div>
        </div>
      </header>

      {/* Menú Móvil Inferior */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#D5DAE6] px-2 py-1 flex justify-around shadow-md">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`py-2 px-2 font-mono text-[10px] font-bold uppercase transition-all ${
                isActive
                  ? 'text-[#13235B] border-t-2 border-[#13235B] -mt-0.5'
                  : 'text-[#5B6480]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
};
