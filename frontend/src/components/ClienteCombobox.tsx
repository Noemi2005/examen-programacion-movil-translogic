import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, User } from 'lucide-react';
import { Cliente } from '../types';

interface ClienteComboboxProps {
  clientes: Cliente[];
  selectedClienteId: string;
  onSelectCliente: (clienteId: string) => void;
  required?: boolean;
}

export const ClienteCombobox: React.FC<ClienteComboboxProps> = ({
  clientes,
  selectedClienteId,
  onSelectCliente,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedCliente = clientes.find((c) => c.id === selectedClienteId);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clientesFiltrados = clientes.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(query) ||
      c.identificacion.toLowerCase().includes(query) ||
      (c.correo && c.correo.toLowerCase().includes(query))
    );
  });

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="label-corp flex items-center justify-between">
        <span>Cliente Solicitante</span>
        <span className="text-[10px] text-[#5B6480] font-mono font-normal">
          {clientes.length} empresas registradas
        </span>
      </label>

      {/* Botón Trigger del Selector */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`input-corp cursor-pointer flex items-center justify-between bg-white transition-all ${
          isOpen ? 'ring-2 ring-[#13235B] border-[#13235B]' : ''
        }`}
      >
        <div className="flex items-center space-x-2 truncate">
          <User className="w-4 h-4 text-[#5B6480] flex-shrink-0" />
          {selectedCliente ? (
            <div className="truncate">
              <span className="font-bold text-[#13235B] text-xs">
                {selectedCliente.nombre}
              </span>
              <span className="ml-2 font-mono text-[11px] text-[#5B6480]">
                ({selectedCliente.identificacion})
              </span>
            </div>
          ) : (
            <span className="text-[#8D9AC0] text-xs italic">
              -- Seleccione un cliente --
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#5B6480] transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown flotante con buscador en vivo */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white border-2 border-[#13235B] shadow-xl max-h-72 flex flex-col">
          {/* Input del Buscador */}
          <div className="p-2 border-b border-[#D5DAE6] bg-[#FAFBFD] flex items-center space-x-2">
            <Search className="w-4 h-4 text-[#5B6480] flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar por RUC, nombre o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs font-mono outline-none text-[#13235B] placeholder:text-[#8D9AC0]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] font-mono text-[#5B6480] hover:text-[#13235B]"
              >
                LIMPIAR
              </button>
            )}
          </div>

          {/* Lista de Resultados */}
          <div className="overflow-y-auto flex-1 divide-y divide-[#D5DAE6]">
            {clientesFiltrados.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-[#5B6480]">
                No se encontraron clientes coincidentes.
              </div>
            ) : (
              clientesFiltrados.map((c) => {
                const isSelected = c.id === selectedClienteId;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCliente(c.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`p-2.5 px-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#13235B] text-white'
                        : 'hover:bg-[#F3F5FA] text-[#13235B]'
                    }`}
                  >
                    <div>
                      <p className={`font-display text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-[#13235B]'}`}>
                        {c.nombre}
                      </p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`font-mono text-[10px] ${isSelected ? 'text-[#F5A623]' : 'text-[#5B6480]'}`}>
                          RUC: {c.identificacion}
                        </span>
                        {c.correo && (
                          <span className={`font-mono text-[10px] ${isSelected ? 'text-slate-300' : 'text-[#8D9AC0]'}`}>
                            &bull; {c.correo}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#F5A623] flex-shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

