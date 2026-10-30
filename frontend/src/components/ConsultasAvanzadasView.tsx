import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, RefreshCw, AlertCircle, ArrowUpRight } from 'lucide-react';
import { api } from '../api/client';

export const ConsultasAvanzadasView: React.FC = () => {
  const [selectedConsulta, setSelectedConsulta] = useState('costo-supera-promedio');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters for queries 23 and 24
  const [fechaInicio, setFechaInicio] = useState('2026-10-01');
  const [fechaFin, setFechaFin] = useState('2026-10-31');

  const consultas = [
    {
      key: 'costo-supera-promedio',
      numero: '21',
      titulo: 'Costo operativo supera el promedio',
      descripcion: 'Servicios de transporte cuyo costo operativo supera el promedio de servicios completados.',
    },
    {
      key: 'participacion-vehiculos',
      numero: '22',
      titulo: 'Participación por vehículo',
      descripcion: 'Porcentaje de participación de cada vehículo en servicios completados.',
    },
    {
      key: 'clientes-frecuentes',
      numero: '23',
      titulo: 'Clientes con ≥ 3 servicios completados',
      descripcion: 'Clientes con al menos tres servicios completados en un período (HAVING COUNT >= 3).',
    },
    {
      key: 'vehiculos-sin-servicios',
      numero: '24',
      titulo: 'Vehículos sin servicios asignados',
      descripcion: 'Vehículos sin servicios asignados durante un rango de fechas.',
    },
    {
      key: 'top-cinco-rentables',
      numero: '25',
      titulo: 'Top 5 vehículos más rentables',
      descripcion: 'Cinco vehículos con mayor rentabilidad por ingresos, costos y margen.',
    },
    {
      key: 'facturacion-mensual-tipo',
      numero: '26',
      titulo: 'Facturación mensual por tipo',
      descripcion: 'Facturación mensual agrupada por tipo de vehículo y mes.',
    },
    {
      key: 'eficiencia-inferior-promedio',
      numero: '27',
      titulo: 'Eficiencia inferior al promedio',
      descripcion: 'Vehículos con eficiencia inferior al promedio de su categoría (consumo mayor).',
    },
    {
      key: 'clientes-disminucion-facturacion',
      numero: '28',
      titulo: 'Clientes con disminución > 20%',
      descripcion: 'Clientes cuya facturación disminuyó más del 20% respecto al mes anterior (Window LAG).',
    },
  ];

  const ejecutarConsulta = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (selectedConsulta === 'vehiculos-sin-servicios' || selectedConsulta === 'clientes-frecuentes') {
        params.fechaInicio = fechaInicio;
        params.fechaFin = fechaFin;
      }
      const data = await api.getConsultaAvanzada(selectedConsulta, params);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar consulta');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ejecutarConsulta();
  }, [selectedConsulta]);

  const consultaActual = consultas.find((c) => c.key === selectedConsulta);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span>Ocho Consultas Avanzadas en Base de Datos (Req-07)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ejecución nativa en el motor PostgreSQL mediante SQL y agregaciones analíticas.
          </p>
        </div>

        <button
          onClick={ejecutarConsulta}
          disabled={loading}
          className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refrescar Consulta</span>
        </button>
      </div>

      {/* Query Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {consultas.map((c) => (
          <button
            key={c.key}
            onClick={() => setSelectedConsulta(c.key)}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              selectedConsulta === c.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
            }`}
          >
            <span
              className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded self-start mb-2 ${
                selectedConsulta === c.key ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Consulta #{c.numero}
            </span>
            <span className="text-xs font-bold line-clamp-1">{c.titulo}</span>
          </button>
        ))}
      </div>

      {/* Description & Optional Date Filters */}
      {consultaActual && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-800">Objetivo de la Consulta:</span>
            <p className="text-slate-600 mt-0.5">{consultaActual.descripcion}</p>
          </div>

          {(selectedConsulta === 'vehiculos-sin-servicios' || selectedConsulta === 'clientes-frecuentes') && (
            <div className="flex items-center space-x-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block">Fecha Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block">Fecha Fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                />
              </div>
              <button
                onClick={ejecutarConsulta}
                className="mt-3.5 px-3 py-1 bg-blue-600 text-white font-semibold rounded text-xs"
              >
                Filtrar
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Dynamic Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Ejecutando SQL analítico en el motor de base de datos...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No se encontraron registros que cumplan con la condición de la consulta.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  {Object.keys(results[0]).map((key) => (
                    <th key={key} className="px-4 py-3">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {Object.values(row).map((val: any, i) => (
                      <td key={i} className="px-4 py-3 font-medium text-slate-800">
                        {val === null || val === undefined ? (
                          <span className="text-slate-300 italic">null</span>
                        ) : typeof val === 'object' ? (
                          JSON.stringify(val)
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
