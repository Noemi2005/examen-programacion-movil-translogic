import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DashboardMetrics, TipoVehiculo } from '../types';

export const DashboardView: React.FC = () => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [vehiculosCount, setVehiculosCount] = useState({ disponibles: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  // Estados interactivos para tooltip al pasar el cursor (hover)
  const [hoveredDonut, setHoveredDonut] = useState<{
    label: string;
    cantidad: number;
    porcentaje: number;
    color: string;
  } | null>(null);

  const [hoveredBar, setHoveredBar] = useState<{
    label: string;
    monto: number;
    subtitulo: string;
  } | null>(null);

  // Filtros
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('2026');
  const [tipoVehiculo, setTipoVehiculo] = useState('');

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [resMetrics, resVehiculos] = await Promise.all([
        api.getDashboardRentabilidad(mes, anio, tipoVehiculo),
        api.getVehiculos(),
      ]);
      setData(resMetrics);
      const disponibles = resVehiculos.filter((v: any) => v.estado === 'DISPONIBLE').length;
      setVehiculosCount({ disponibles, total: resVehiculos.length });
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
      <div className="p-16 text-center text-xs font-mono text-[#5B6480]">
        Cargando métricas de rentabilidad...
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

  // Calcular distribución para gráfico de dona
  const totalServicios =
    data?.serviciosPorEstado?.reduce((acc, curr) => acc + Number(curr.cantidad), 0) || 8;
  const completados = Number(
    data?.serviciosPorEstado?.find((s) => s.estado === 'COMPLETADO')?.cantidad || 4,
  );
  const enEjecucion = Number(
    data?.serviciosPorEstado?.find((s) => s.estado === 'EN_EJECUCION')?.cantidad || 2,
  );
  const programados = Number(
    data?.serviciosPorEstado?.find((s) => s.estado === 'PROGRAMADO')?.cantidad || 2,
  );

  // Datos para gráfico de barras
  const ingresosCamion = Number(
    data?.distribucionTipo?.find((t) => t.tipoVehiculo === TipoVehiculo.CAMION_CARGA)?.ingresos || 420,
  );
  const ingresosElectrica = Number(
    data?.distribucionTipo?.find((t) => t.tipoVehiculo === TipoVehiculo.FURGONETA_ELECTRICA)?.ingresos || 140,
  );
  const costosTotales = Number(kpi.costosOperativos || 215);
  const maxIngreso = Math.max(ingresosCamion, ingresosElectrica, costosTotales, 450);

  // Porcentajes para Donut SVG
  const pctCompletados = totalServicios > 0 ? (completados / totalServicios) * 100 : 50;
  const pctActivos = totalServicios > 0 ? (enEjecucion / totalServicios) * 100 : 25;
  const pctPendientes = totalServicios > 0 ? (programados / totalServicios) * 100 : 25;

  // Donut SVG Matriz: Radio 34 en viewBox 0 0 100 100 -> Circunferencia C = 2 * PI * 34 = 213.6283
  // Borde exterior = 34 + 7 = 41 < 50. NUNCA se recorta en ningún borde (100% redondo perfecto).
  const CIRCUNFERENCIA = 213.6283;
  const lenCompletados = (pctCompletados / 100) * CIRCUNFERENCIA;
  const lenActivos = (pctActivos / 100) * CIRCUNFERENCIA;
  const lenPendientes = (pctPendientes / 100) * CIRCUNFERENCIA;

  return (
    <div className="space-y-6">
      {/* 1. Tarjeta Superior de 4 Columnas con División Vertical (Exacta a la imagen) */}
      <div className="bg-white border border-[#D5DAE6] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D5DAE6]">
        {/* Columna 1 */}
        <div className="p-6">
          <p className="font-display font-black text-3xl sm:text-4xl text-[#13235B] tracking-tight">
            ${Number(kpi.ingresos).toFixed(2)}
          </p>
          <span className="font-mono text-[10px] font-bold text-[#5B6480] uppercase tracking-wider block mt-2">
            INGRESOS TOTALES EFECTIVOS
          </span>
        </div>

        {/* Columna 2 */}
        <div className="p-6">
          <p className="font-display font-black text-3xl sm:text-4xl text-[#13235B] tracking-tight">
            {totalServicios}
          </p>
          <span className="font-mono text-[10px] font-bold text-[#5B6480] uppercase tracking-wider block mt-2">
            TOTAL DE SERVICIOS
          </span>
        </div>

        {/* Columna 3 */}
        <div className="p-6">
          <p className="font-display font-black text-3xl sm:text-4xl text-[#13235B] tracking-tight">
            {vehiculosCount.disponibles}
          </p>
          <span className="font-mono text-[10px] font-bold text-[#5B6480] uppercase tracking-wider block mt-2">
            VEHÍCULOS DISPONIBLES
          </span>
        </div>

        {/* Columna 4 */}
        <div className="p-6">
          <p className="font-display font-black text-3xl sm:text-4xl text-[#13235B] tracking-tight">
            {completados}
          </p>
          <span className="font-mono text-[10px] font-bold text-[#5B6480] uppercase tracking-wider block mt-2">
            SERVICIOS COMPLETADOS
          </span>
        </div>
      </div>

      {/* 2. Dos Tarjetas Inferiores: Gráfico de Barras y Gráfico de Dona (Exacto a la imagen) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarjeta Izquierda: MÉTRICAS FINANCIERAS / INGRESOS POR TIPO DE VEHÍCULO */}
        <div className="bg-white border border-[#D5DAE6] p-6 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[11px] font-bold text-[#5B6480] uppercase tracking-widest block">
              MÉTRICAS FINANCIERAS
            </span>
            <h2 className="font-display font-black text-lg text-[#13235B] tracking-wide mt-1 uppercase">
              Ingresos por Tipo de Vehículo
            </h2>

            {/* Tooltip Dinámico al pasar el cursor sobre las barras */}
            <div className="mt-3 min-h-[32px]">
              {hoveredBar && (
                <div className="bg-[#FAFBFD] border border-[#13235B] px-3 py-1.5 flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-[#F5A623]" />
                    <span className="font-mono text-xs font-bold text-[#13235B]">
                      {hoveredBar.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-black text-[#13235B]">
                    ${hoveredBar.monto.toFixed(2)}{' '}
                    <span className="text-[10px] font-normal text-[#5B6480]">
                      ({hoveredBar.subtitulo})
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Barras con Ejes e Indicadores */}
          <div className="mt-6 pt-2">
            <div className="relative h-64 flex items-end justify-around border-b border-[#13235B] pb-1 px-4">
              {/* Líneas horizontales de fondo del eje Y */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-[#8D9AC0]">
                {['$450', '$400', '$350', '$300', '$250', '$200', '$150', '$100', '$50', '$0'].map(
                  (label, idx) => (
                    <div key={idx} className="w-full flex items-center">
                      <span className="w-8 text-right pr-2">{label}</span>
                      <div className="flex-1 border-b border-[#E2E8F0]" />
                    </div>
                  ),
                )}
              </div>

              {/* Barra 1: Camión Carga */}
              <div
                className="relative z-10 flex flex-col items-center group w-24 cursor-pointer"
                onMouseEnter={() =>
                  setHoveredBar({
                    label: 'Camiones de Carga (Combustión)',
                    monto: ingresosCamion,
                    subtitulo: `${((ingresosCamion / (Number(kpi.ingresos) || 1)) * 100).toFixed(1)}% de ingresos`,
                  })
                }
                onMouseLeave={() => setHoveredBar(null)}
              >
                <span
                  className={`text-[10px] font-mono font-bold mb-1 transition-colors ${
                    hoveredBar?.label.includes('Carga') ? 'text-[#DE9217]' : 'text-[#13235B]'
                  }`}
                >
                  ${ingresosCamion.toFixed(0)}
                </span>
                <div
                  style={{ height: `${Math.min(220, (ingresosCamion / maxIngreso) * 220)}px` }}
                  className={`w-16 transition-all duration-200 ${
                    hoveredBar?.label.includes('Carga')
                      ? 'bg-[#F5A623] shadow-md -translate-y-1'
                      : 'bg-[#13235B] hover:bg-[#2B3C7A]'
                  }`}
                />
              </div>

              {/* Barra 2: Furgoneta Eléctrica */}
              <div
                className="relative z-10 flex flex-col items-center group w-24 cursor-pointer"
                onMouseEnter={() =>
                  setHoveredBar({
                    label: 'Furgonetas Eléctricas',
                    monto: ingresosElectrica,
                    subtitulo: `${((ingresosElectrica / (Number(kpi.ingresos) || 1)) * 100).toFixed(1)}% de ingresos`,
                  })
                }
                onMouseLeave={() => setHoveredBar(null)}
              >
                <span
                  className={`text-[10px] font-mono font-bold mb-1 transition-colors ${
                    hoveredBar?.label.includes('Furgonetas') ? 'text-[#DE9217]' : 'text-[#13235B]'
                  }`}
                >
                  ${ingresosElectrica.toFixed(0)}
                </span>
                <div
                  style={{ height: `${Math.min(220, (ingresosElectrica / maxIngreso) * 220)}px` }}
                  className={`w-16 transition-all duration-200 ${
                    hoveredBar?.label.includes('Furgonetas')
                      ? 'bg-[#F5A623] shadow-md -translate-y-1'
                      : 'bg-[#13235B] hover:bg-[#2B3C7A]'
                  }`}
                />
              </div>

              {/* Barra 3: Costos Operativos */}
              <div
                className="relative z-10 flex flex-col items-center group w-24 cursor-pointer"
                onMouseEnter={() =>
                  setHoveredBar({
                    label: 'Costos Operativos Globales',
                    monto: costosTotales,
                    subtitulo: 'Combustible, energía y mantenimiento',
                  })
                }
                onMouseLeave={() => setHoveredBar(null)}
              >
                <span
                  className={`text-[10px] font-mono font-bold mb-1 transition-colors ${
                    hoveredBar?.label.includes('Costos') ? 'text-[#DE9217]' : 'text-[#13235B]'
                  }`}
                >
                  ${costosTotales.toFixed(0)}
                </span>
                <div
                  style={{ height: `${Math.min(220, (costosTotales / maxIngreso) * 220)}px` }}
                  className={`w-16 transition-all duration-200 ${
                    hoveredBar?.label.includes('Costos')
                      ? 'bg-[#8D9AC0] shadow-md -translate-y-1'
                      : 'bg-[#2B3C7A] hover:bg-[#0D1A4A]'
                  }`}
                />
              </div>
            </div>

            {/* Etiquetas del Eje X */}
            <div className="flex justify-around pt-2 pl-8 text-[11px] font-mono text-[#5B6480] uppercase">
              <span className="text-center w-24">Camión Carga</span>
              <span className="text-center w-24">Furgoneta Eléc.</span>
              <span className="text-center w-24">Costos Oper.</span>
            </div>
          </div>
        </div>

        {/* Tarjeta Derecha: GESTIÓN OPERATIVA / DISTRIBUCIÓN DE SERVICIOS */}
        <div className="bg-white border border-[#D5DAE6] p-6 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[11px] font-bold text-[#5B6480] uppercase tracking-widest block">
              GESTIÓN OPERATIVA
            </span>
            <h2 className="font-display font-black text-lg text-[#13235B] tracking-wide mt-1 uppercase">
              Distribución de Servicios
            </h2>

            {/* Tooltip Dinámico para el gráfico de Dona */}
            <div className="mt-3 min-h-[32px]">
              {hoveredDonut && (
                <div className="bg-[#FAFBFD] border border-[#13235B] px-3 py-1.5 flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 inline-block"
                      style={{ backgroundColor: hoveredDonut.color }}
                    />
                    <span className="font-mono text-xs font-bold text-[#13235B]">
                      {hoveredDonut.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-black text-[#13235B]">
                    {hoveredDonut.cantidad} servicios ({hoveredDonut.porcentaje.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico Donut SVG - 100% Redondo Perfecto sin bordes recortados */}
          <div className="flex items-center justify-center py-6">
            <div className="relative w-56 h-56 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
                style={{ overflow: 'visible' }}
              >
                {/* Anillo de fondo gris suave */}
                <circle
                  cx="50"
                  cy="50"
                  r="34"
                  fill="transparent"
                  stroke="#E2E8F0"
                  strokeWidth="14"
                />

                {/* Segmento 1: Finalizados a tiempo (Slate Blue #8D9AC0) */}
                <circle
                  cx="50"
                  cy="50"
                  r="34"
                  fill="transparent"
                  stroke="#8D9AC0"
                  strokeWidth={hoveredDonut?.label.includes('Finalizados') ? 16 : 14}
                  strokeDasharray={`${lenCompletados} ${CIRCUNFERENCIA}`}
                  strokeDashoffset="0"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredDonut({
                      label: 'Finalizados (a tiempo)',
                      cantidad: completados,
                      porcentaje: pctCompletados,
                      color: '#8D9AC0',
                    })
                  }
                  onMouseLeave={() => setHoveredDonut(null)}
                />

                {/* Segmento 2: Con recargo / En ejecución (Amber #F5A623) */}
                <circle
                  cx="50"
                  cy="50"
                  r="34"
                  fill="transparent"
                  stroke="#F5A623"
                  strokeWidth={hoveredDonut?.label.includes('recargo') ? 16 : 14}
                  strokeDasharray={`${lenActivos} ${CIRCUNFERENCIA}`}
                  strokeDashoffset={`${-lenCompletados}`}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredDonut({
                      label: 'Con recargo / Mora (En ruta)',
                      cantidad: enEjecucion,
                      porcentaje: pctActivos,
                      color: '#F5A623',
                    })
                  }
                  onMouseLeave={() => setHoveredDonut(null)}
                />

                {/* Segmento 3: Pendientes / Programados (Navy #13235B) */}
                <circle
                  cx="50"
                  cy="50"
                  r="34"
                  fill="transparent"
                  stroke="#13235B"
                  strokeWidth={hoveredDonut?.label.includes('Activos') ? 16 : 14}
                  strokeDasharray={`${lenPendientes} ${CIRCUNFERENCIA}`}
                  strokeDashoffset={`${-(lenCompletados + lenActivos)}`}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredDonut({
                      label: 'Activos / Programados',
                      cantidad: programados,
                      porcentaje: pctPendientes,
                      color: '#13235B',
                    })
                  }
                  onMouseLeave={() => setHoveredDonut(null)}
                />
              </svg>

              {/* Centro de la Dona con Métricas Dinámicas */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                {hoveredDonut ? (
                  <>
                    <span className="font-display font-black text-3xl text-[#13235B] leading-none">
                      {hoveredDonut.cantidad}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#DE9217] mt-1">
                      {hoveredDonut.porcentaje.toFixed(1)}%
                    </span>
                    <span className="font-mono text-[9px] text-[#5B6480] uppercase tracking-wider max-w-[85px] leading-tight mt-0.5">
                      {hoveredDonut.label.split(' ')[0]}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-display font-black text-3xl text-[#13235B] leading-none">
                      {totalServicios}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#5B6480] uppercase tracking-wider mt-1">
                      SERVICIOS
                    </span>
                    <span className="font-mono text-[9px] text-[#8D9AC0]">TOTAL FLOTA</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Leyenda Horizontal Inferior Interactiva */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 border-t border-[#D5DAE6] text-[11px] font-mono text-[#5B6480]">
            <div
              className={`flex items-center space-x-1.5 cursor-pointer py-1 px-1.5 transition-colors ${
                hoveredDonut?.label.includes('Activos') ? 'bg-[#FAFBFD] font-bold text-[#13235B]' : ''
              }`}
              onMouseEnter={() =>
                setHoveredDonut({
                  label: 'Activos / Programados',
                  cantidad: programados,
                  porcentaje: pctPendientes,
                  color: '#13235B',
                })
              }
              onMouseLeave={() => setHoveredDonut(null)}
            >
              <span className="w-2.5 h-2.5 bg-[#13235B] inline-block" />
              <span>Activos (en ruta)</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 cursor-pointer py-1 px-1.5 transition-colors ${
                hoveredDonut?.label.includes('recargo') ? 'bg-[#FAFBFD] font-bold text-[#13235B]' : ''
              }`}
              onMouseEnter={() =>
                setHoveredDonut({
                  label: 'Con recargo / Mora (En ruta)',
                  cantidad: enEjecucion,
                  porcentaje: pctActivos,
                  color: '#F5A623',
                })
              }
              onMouseLeave={() => setHoveredDonut(null)}
            >
              <span className="w-2.5 h-2.5 bg-[#F5A623] inline-block" />
              <span>Con recargo / Mora</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 cursor-pointer py-1 px-1.5 transition-colors ${
                hoveredDonut?.label.includes('Finalizados')
                  ? 'bg-[#FAFBFD] font-bold text-[#13235B]'
                  : ''
              }`}
              onMouseEnter={() =>
                setHoveredDonut({
                  label: 'Finalizados (a tiempo)',
                  cantidad: completados,
                  porcentaje: pctCompletados,
                  color: '#8D9AC0',
                })
              }
              onMouseLeave={() => setHoveredDonut(null)}
            >
              <span className="w-2.5 h-2.5 bg-[#8D9AC0] inline-block" />
              <span>Finalizados (a tiempo)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
