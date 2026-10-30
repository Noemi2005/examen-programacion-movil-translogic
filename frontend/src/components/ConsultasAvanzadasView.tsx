import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

export const ConsultasAvanzadasView: React.FC = () => {
  const [selectedConsulta, setSelectedConsulta] = useState('costo-supera-promedio');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
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
      {/* Header Idéntico a la Imagen 1 */}
      <div className="space-y-1">
        <span className="font-mono text-xs font-bold text-[#5B6480] uppercase tracking-widest">
          05 / REPORTES Y ANALÍTICA
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#13235B]">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#13235B] tracking-tight uppercase">
            CONSULTAS ANALÍTICAS SQL
          </h1>
          <button
            type="button"
            onClick={ejecutarConsulta}
            disabled={loading}
            className="btn bg-[#13235B] hover:bg-[#0D1A4A] text-white h-11 px-5 text-xs font-extrabold tracking-wider"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span>EJECUTAR CONSULTA</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {consultas.map((c) => {
          const isSelected = selectedConsulta === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelectedConsulta(c.key)}
              className={`p-3 border text-left transition-all ${
                isSelected
                  ? 'bg-[#13235B] text-white border-[#13235B]'
                  : 'bg-white text-[#13235B] border-[#D5DAE6] hover:border-[#13235B]'
              }`}
            >
              <span
                className={`tag-mono text-[9px] block ${
                  isSelected ? 'text-[#F5A623]' : 'text-[#5B6480]'
                }`}
              >
                CONSULTA #{c.numero}
              </span>
              <span className="font-bold text-xs uppercase line-clamp-1 mt-1 block">
                {c.titulo}
              </span>
            </button>
          );
        })}
      </div>

      {/* Descripción y Filtros */}
      {consultaActual && (
        <div className="p-4 bg-white border border-[#D5DAE6] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="tag-mono block text-[#13235B] font-bold">Definición de Consulta:</span>
            <p className="text-xs text-[#5B6480] mt-0.5 font-mono">{consultaActual.descripcion}</p>
          </div>

          {(selectedConsulta === 'vehiculos-sin-servicios' || selectedConsulta === 'clientes-frecuentes') && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="input-corp text-xs font-mono w-auto h-9"
              />
              <span className="text-xs text-[#5B6480]">a</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="input-corp text-xs font-mono w-auto h-9"
              />
              <button
                type="button"
                onClick={ejecutarConsulta}
                className="btn btn--accent h-9 text-xs"
              >
                Filtrar
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-white border-l-4 border-[#C62828] border border-[#D5DAE6] text-[#C62828] text-xs font-mono">
          {error}
        </div>
      )}

      {/* Resultados */}
      <div className="bg-white border border-[#D5DAE6] overflow-x-auto shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-[#5B6480]">
            Ejecutando agregación analítica en PostgreSQL...
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[#5B6480]">
            No se encontraron registros que cumplan con la condición de la consulta.
          </div>
        ) : (
          <table className="table-corp">
            <thead>
              <tr>
                {Object.keys(results[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val: any, i) => (
                    <td key={i} className="font-mono text-xs text-[#13235B]">
                      {val === null || val === undefined ? (
                        <span className="text-[#8D9AC0] italic">null</span>
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
        )}
      </div>
    </div>
  );
};
