import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Fuel,
  PieChart,
  BarChart3,
  Calendar,
  Filter,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardMetrics, TipoVehiculo } from '../types';

export const DashboardView: React.FC = () => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('2026');
  const [tipoVehiculo, setTipoVehiculo] = useState('');

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardRentabilidad(mes, anio, tipoVehiculo);
      setData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [mes, anio, tipoVehiculo]);

  if (loading && !data) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Cargando métricas de rentabilidad...</p>
      </div>
    );
  }

  const kpi = data?.kpi || {
    ingresos: 0,
    costosOperativos: 0,
    utilidad: 0,
    margenPorcentaje: 0,
    serviciosCompletados: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>Dashboard de Rentabilidad de la Flota (Req-08)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Análisis financiero en tiempo real: Ingresos, Costos Operativos, Margen y Estados
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none"
            >
              <option value="">Todo el Año</option>
              <option value="01">Enero</option>
              <option value="02">Febrero</option>
              <option value="03">Marzo</option>
              <option value="04">Abril</option>
              <option value="05">Mayo</option>
              <option value="06">Junio</option>
              <option value="07">Julio</option>
              <option value="08">Agosto</option>
              <option value="09">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>

          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <select
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={tipoVehiculo}
              onChange={(e) => setTipoVehiculo(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none"
            >
              <option value="">Toda la Flota</option>
              <option value={TipoVehiculo.CAMION_CARGA}>Camiones</option>
              <option value={TipoVehiculo.FURGONETA_ELECTRICA}>Eléctricas</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ingresos */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Ingresos Totales
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            ${Number(kpi.ingresos).toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400">Servicios completados</span>
        </div>

        {/* Costos Operativos */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Fuel className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Costos Operativos
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            ${Number(kpi.costosOperativos).toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400">Combustible + Mantenimiento</span>
        </div>

        {/* Utilidad */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Utilidad Neta
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
            ${Number(kpi.utilidad).toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400">Ingresos − Costos</span>
        </div>

        {/* Margen */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Percent className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Margen Operativo
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 mt-1">
            {Number(kpi.margenPorcentaje).toFixed(2)}%
          </p>
          <span className="text-[10px] text-slate-400">Utilidad / Ingresos × 100</span>
        </div>
      </div>

      {/* Gráficos Requeridos (Gráfico de Barras y Gráfico de Líneas SVG interactivo) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Barras: Distribución por Tipo de Vehículo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Distribución por Tipo de Vehículo (Gráfico de Barras)</span>
            </h3>
          </div>

          <div className="space-y-4 pt-2">
            {data?.distribucionTipo && data.distribucionTipo.length > 0 ? (
              data.distribucionTipo.map((item, idx) => {
                const ing = Number(item.ingresos);
                const maxIng = Math.max(
                  ...data.distribucionTipo.map((t) => Number(t.ingresos)),
                  1,
                );
                const porcentaje = Math.round((ing / maxIng) * 100);
                const isCamion = item.tipoVehiculo === TipoVehiculo.CAMION_CARGA;

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{isCamion ? 'Camiones de Carga' : 'Furgonetas Eléctricas'}</span>
                      <span>${ing.toFixed(2)} ({item.totalServicios} servicios)</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${porcentaje}%` }}
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCamion ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No hay datos en el periodo seleccionado.</p>
            )}
          </div>
        </div>

        {/* Gráfico de Líneas / Comparación Mensual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Evolución Mensual (Gráfico Comparativo)</span>
            </h3>
          </div>

          <div className="pt-2">
            {data?.evolucionMensual && data.evolucionMensual.length > 0 ? (
              <div className="space-y-3">
                {data.evolucionMensual.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{m.periodo}</span>
                      <span className="text-[11px] text-slate-500 block">
                        Costos: ${Number(m.costos).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-blue-600">
                        ${Number(m.ingresos).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        Utilidad: ${Number(m.utilidad).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Sin registros mensuales para graficar.</p>
            )}
          </div>
        </div>
      </div>

      {/* Servicios por Estado y Tabla Resumen */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center space-x-1.5">
          <PieChart className="w-4 h-4 text-emerald-600" />
          <span>Servicios por Estado en el Sistema</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {data?.serviciosPorEstado?.map((item, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                {item.estado}
              </span>
              <span className="text-lg font-extrabold text-slate-800 mt-1 block">
                {item.cantidad}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
