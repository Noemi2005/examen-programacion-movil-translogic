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
      setError(err.message || 'Error al autenticar');
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
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 p-6 text-white text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TRANSLOGIC S.A.</h1>
          <p className="text-xs text-blue-200 mt-1">Gestión de Flotas, Servicios y Facturación</p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@translogic.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
              Credenciales Rápidas para Evaluación
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="py-2 px-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-[11px] font-medium text-slate-700 flex items-center justify-center space-x-1.5 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Admin Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('OPERADOR')}
                className="py-2 px-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-[11px] font-medium text-slate-700 flex items-center justify-center space-x-1.5 transition-all"
              >
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>Operador Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
