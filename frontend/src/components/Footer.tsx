import React from 'react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#13235B] text-white mt-16 pt-12 pb-8 border-t-2 border-[#0D1A4A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 pb-10">
          {/* Columna Izquierda: Marca y Descripción */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#F5A623] inline-block flex-shrink-0" />
              <h2 className="font-display font-black text-xl tracking-wider text-white">
                TRANSLOGIC S.A.
              </h2>
            </div>
            <p className="text-xs text-[#8D9AC0] font-sans font-medium">
              Transporte inteligente de carga y furgonetas eléctricas
            </p>
            <p className="text-xs text-[#8D9AC0] font-sans">
              Sistema de gestión de flotas, servicios y facturación simulada
            </p>
          </div>

          {/* Columna Derecha: Enlaces del Sistema */}
          <div className="space-y-3">
            <span className="font-mono text-[11px] font-bold text-[#8D9AC0] tracking-widest uppercase block">
              SISTEMA
            </span>
            <ul className="space-y-1.5 font-display text-xs font-bold uppercase tracking-wider text-[#D5DAE6]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-[#F5A623] transition-colors"
                >
                  DASHBOARD
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('vehiculos')}
                  className="hover:text-[#F5A623] transition-colors"
                >
                  VEHÍCULOS
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('servicios')}
                  className="hover:text-[#F5A623] transition-colors"
                >
                  SERVICIOS
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('facturacion')}
                  className="hover:text-[#F5A623] transition-colors"
                >
                  FACTURACIÓN
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('consultas')}
                  className="hover:text-[#F5A623] transition-colors"
                >
                  CONSULTAS
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Franja Inferior de Copyright */}
        <div className="pt-6 border-t border-[#2B3C7A] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#8D9AC0] gap-2">
          <span>(C) 2026 TRANSLOGIC S.A. TODOS LOS DERECHOS RESERVADOS.</span>
          <span className="tracking-widest uppercase text-[#8D9AC0]">
            SISTEMA DE GESTIÓN Y FACTURACIÓN
          </span>
        </div>
      </div>
    </footer>
  );
};

