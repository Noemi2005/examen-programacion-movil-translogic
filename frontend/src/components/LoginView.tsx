import React, { useState } from 'react';
import { Truck, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { Usuario } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: Usuario, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@translogic.com');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('translogic_token', data.accessToken);
      localStorage.setItem('translogic_user', JSON.stringify(data.usuario));
      onLoginSuccess(data.usuario, data.accessToken);
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'ADMIN' | 'OPERADOR') => {
    if (role === 'ADMIN') {
      setEmail('admin@translogic.com');
      setPassword('Admin123!');
    } else {
      setEmail('operador@translogic.com');
      setPassword('Operador123!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#13235B] shadow-[8px_8px_0_#13235B]">
        {/* Cabecera Oscura Brutalista */}
        <div className="bg-[#13235B] p-6 text-white text-center border-b-2 border-[#0D1A4A]">
          <div className="w-12 h-12 mx-auto mb-3 bg-[#F5A623] text-[#0D1A4A] flex items-center justify-center">
            <Truck className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="accent-dot" />
            <h1 className="font-display font-black text-xl tracking-wider text-white">
              TRANSLOGIC S.A.
            </h1>
          </div>
          <p className="tag-mono text-[10px] text-[#8D9AC0] mt-1">
            CONTROL Y GESTIÓN DE FLOTAS - ACCESO SEGURO
          </p>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-white border-l-4 border-[#C62828] border border-[#D5DAE6] text-[#C62828] text-xs font-mono font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-corp">Correo Electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@translogic.com"
                className="input-corp font-mono text-xs"
              />
            </div>

            <div>
              <label className="label-corp">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-corp text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn--accent w-full h-12 text-xs font-bold"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Acceso Rápido para Evaluación */}
          <div className="pt-4 border-t border-[#D5DAE6] space-y-3">
            <span className="tag-mono block text-center text-[#5B6480]">
              Credenciales Rápidas para Examen
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="btn btn--outline h-10 text-[11px]"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#13235B]" />
                <span>Admin Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('OPERADOR')}
                className="btn btn--outline h-10 text-[11px]"
              >
                <Truck className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Operador Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
