import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, Database, Download } from 'lucide-react';
import { api } from '../api/client';
import { LISTA_CONSULTAS, ConsultaCardInfo } from './ConsultasView';
import { Pagination } from './Pagination';

interface ConsultaDetalleViewProps {
  consultaKey: string;
  onBack: () => void;
}

export const ConsultaDetalleView: React.FC<ConsultaDetalleViewProps> = ({
  consultaKey,
  onBack,
}) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 8;

  // Parámetros de filtro
  const [fechaInicio, setFechaInicio] = useState('2026-10-01');
  const [fechaFin, setFechaFin] = useState('2026-10-31');

  const consultaInfo: ConsultaCardInfo =
    LISTA_CONSULTAS.find((c) => c.key === consultaKey) || {
      key: consultaKey,
      numero: '00',
      titulo: 'CONSULTA ANALÍTICA',
      descripcion: 'Detalle de ejecución analítica en base de datos.',
      tag: 'SQL',
    };

  const ejecutar = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (
        consultaKey === 'vehiculos-sin-servicios' ||
        consultaKey === 'clientes-frecuentes'
      ) {
        params.fechaInicio = fechaInicio;
        params.fechaFin = fechaFin;
      }
      const data = await api.getConsultaAvanzada(consultaKey, params);
      setResults(data);
      setPage(1);
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar la consulta analítica');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ejecutar();
  }, [consultaKey]);

  const exportarCSV = () => {
    if (!results || results.length === 0) return;
    const headers = Object.keys(results[0]).join(',');
    const rows = results
      .map((row) =>
        Object.values(row)
          .map((v) => `"${v}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_${consultaKey}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Botón de Regreso a la cuadrícula */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="btn btn--outline h-9 px-3 text-xs font-mono font-bold flex items-center space-x-2 text-[#13235B] border-[#13235B] hover:bg-[#13235B] hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← VOLVER A REPORTES ANALÍTICOS</span>
        </button>
      </div>

      {/* Header Detallado de la Consulta */}
      <div className="bg-white p-6 border border-[#D5DAE6]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#F5A623] inline-block" />
              <span className="font-mono text-xs font-bold text-[#5B6480] uppercase tracking-widest">
                REPORTE {consultaInfo.numero} &nbsp;|&nbsp; {consultaInfo.tag}
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[#13235B] tracking-tight uppercase mt-2">
              {consultaInfo.titulo}
            </h1>
            <p className="text-xs text-[#5B6480] mt-1 font-sans max-w-3xl">
              {consultaInfo.descripcion}
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-auto">
            {results.length > 0 && (
              <button
                type="button"
                onClick={exportarCSV}
                className="btn btn--outline h-10 px-3 text-xs font-mono font-bold flex items-center space-x-1.5"
                title="Descargar CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORTAR CSV</span>
              </button>
            )}
            <button
              type="button"
              onClick={ejecutar}
              disabled={loading}
              className="btn bg-[#13235B] hover:bg-[#0D1A4A] text-white h-10 px-4 text-xs font-extrabold tracking-wider flex items-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>ACTUALIZAR DATOS</span>
            </button>
          </div>
        </div>

        {/* Parámetros de Filtro (si aplica) */}
        {(consultaKey === 'vehiculos-sin-servicios' ||
          consultaKey === 'clientes-frecuentes') && (
          <div className="mt-6 pt-4 border-t border-[#D5DAE6] flex flex-wrap items-center gap-4">
            <span className="font-mono text-[11px] font-bold text-[#13235B] uppercase">
              RANGO DE FECHAS:
            </span>
            <div className="flex items-center space-x-2">
              <label className="text-[11px] font-mono text-[#5B6480]">Desde:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="input h-8 text-xs font-mono py-0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-[11px] font-mono text-[#5B6480]">Hasta:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="input h-8 text-xs font-mono py-0"
              />
            </div>
            <button
              type="button"
              onClick={ejecutar}
              disabled={loading}
              className="btn btn--accent h-8 px-3 text-xs font-bold"
            >
              APLICAR FILTRO
            </button>
          </div>
        )}
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-[#C62828] p-4 text-[#C62828] flex items-center space-x-2 font-mono text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Resultados de la Consulta */}
      <div className="bg-white border border-[#D5DAE6]">
        <div className="px-6 py-3 border-b border-[#D5DAE6] bg-[#FAFBFD] flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[#13235B] uppercase tracking-wider flex items-center space-x-2">
            <Database className="w-3.5 h-3.5 text-[#5B6480]" />
            <span>REGISTROS OBTENIDOS ({results.length})</span>
          </span>
          <span className="font-mono text-[10px] text-[#5B6480]">
            Motor: PostgreSQL 16 &bull; SQL Nativo
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center font-mono text-xs text-[#5B6480]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#13235B]" />
            Ejecutando consulta en la base de datos...
          </div>
        ) : results.length === 0 ? (
          <div className="p-16 text-center font-mono text-xs text-[#5B6480]">
            No se encontraron registros para los criterios especificados.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="table-corp">
              <thead>
                <tr>
                  {Object.keys(results[0]).map((key) => (
                    <th key={key} className="whitespace-nowrap">
                      {key.toUpperCase().replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.slice((page - 1) * limit, page * limit).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F3F5FA] transition-colors">
                    {Object.entries(row).map(([key, val]: [string, any], cIdx) => {
                      const isNumeric =
                        typeof val === 'number' ||
                        (!isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '');
                      const isCurrency =
                        key.toLowerCase().includes('precio') ||
                        key.toLowerCase().includes('costo') ||
                        key.toLowerCase().includes('monto') ||
                        key.toLowerCase().includes('total') ||
                        key.toLowerCase().includes('ingreso') ||
                        key.toLowerCase().includes('utilidad') ||
                        key.toLowerCase().includes('rentabilidad');
                      const isPercent =
                        key.toLowerCase().includes('porcentaje') ||
                        key.toLowerCase().includes('participacion') ||
                        key.toLowerCase().includes('margen');

                      return (
                        <td
                          key={cIdx}
                          className={`font-mono text-xs ${
                            isNumeric ? 'text-right' : 'text-left'
                          } ${cIdx === 0 ? 'font-bold text-[#13235B]' : ''}`}
                        >
                          {val === null || val === undefined ? (
                            <span className="text-[#8D9AC0] italic">NULL</span>
                          ) : isCurrency && !isNaN(Number(val)) ? (
                            `$${Number(val).toFixed(2)}`
                          ) : isPercent && !isNaN(Number(val)) ? (
                            `${Number(val).toFixed(1)}%`
                          ) : typeof val === 'boolean' ? (
                            val ? (
                              <span className="badge badge--success">SÍ</span>
                            ) : (
                              <span className="badge badge--danger">NO</span>
                            )
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación Corporativa */}
        {results.length > 0 && (
          <div className="border-t border-[#D5DAE6]">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(results.length / limit) || 1}
              totalItems={results.length}
              itemsPerPage={limit}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

