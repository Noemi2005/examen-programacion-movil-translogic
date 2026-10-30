import React from 'react';

export interface ConsultaCardInfo {
  key: string;
  numero: string;
  titulo: string;
  descripcion: string;
  tag: string;
}

export const LISTA_CONSULTAS: ConsultaCardInfo[] = [
  {
    key: 'costo-supera-promedio',
    numero: '01',
    titulo: 'COSTO SUPERA EL PROMEDIO',
    descripcion: 'Servicios de transporte cuyo costo operativo supera el promedio general de servicios completados.',
    tag: 'SUBCONSULTA SQL',
  },
  {
    key: 'participacion-vehiculos',
    numero: '02',
    titulo: 'PARTICIPACIÓN POR VEHÍCULO',
    descripcion: 'Porcentaje de participación y volumen de cada vehículo en servicios completados de la flota.',
    tag: 'CONSOLIDADO SQL',
  },
  {
    key: 'clientes-frecuentes',
    numero: '03',
    titulo: 'CLIENTES FRECUENTES',
    descripcion: 'Listado de clientes con 3 o más servicios completados registrados en un período específico.',
    tag: 'HAVING COUNT >= 3',
  },
  {
    key: 'top-cinco-rentables',
    numero: '04',
    titulo: 'VEHÍCULOS RENTABLES',
    descripcion: 'Ranking de los 5 vehículos con mayor rentabilidad neta por ingresos, costos y margen operativo.',
    tag: 'RANKING TOP 5',
  },
  {
    key: 'vehiculos-sin-servicios',
    numero: '05',
    titulo: 'VEHÍCULOS SIN SERVICIOS',
    descripcion: 'Vehículos que no registraron ningún servicio asignado durante un rango de fechas determinado.',
    tag: 'NOT EXISTS / LEFT JOIN',
  },
  {
    key: 'facturacion-mensual-tipo',
    numero: '06',
    titulo: 'FACTURACIÓN POR TIPO',
    descripcion: 'Facturación mensual acumulada desagregada por camiones de combustión y furgonetas eléctricas.',
    tag: 'AGRUPACIÓN Y TOTALES',
  },
  {
    key: 'eficiencia-inferior-promedio',
    numero: '07',
    titulo: 'EFICIENCIA INFERIOR AL PROMEDIO',
    descripcion: 'Vehículos con rendimiento energético o de combustible menor al promedio de su misma categoría.',
    tag: 'MÉTRICAS TÉCNICAS',
  },
  {
    key: 'clientes-disminucion-facturacion',
    numero: '08',
    titulo: 'DISMINUCIÓN DE FACTURACIÓN',
    descripcion: 'Clientes cuya facturación cayó más del 20% comparado con el mes inmediato anterior.',
    tag: 'WINDOW FUNCTION LAG',
  },
];

interface ConsultasViewProps {
  onSelectConsulta: (key: string) => void;
}

export const ConsultasView: React.FC<ConsultasViewProps> = ({ onSelectConsulta }) => {
  return (
    <div className="space-y-6">
      {/* Header Idéntico a la Imagen */}
      <div className="space-y-1">
        <span className="font-mono text-xs font-bold text-[#5B6480] uppercase tracking-widest">
          06 / CONSULTAS
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#13235B] tracking-tight uppercase">
          REPORTES ANALÍTICOS
        </h1>
        <p className="text-xs text-[#5B6480] font-sans pb-4">
          Seleccione una de las siguientes consultas analíticas del sistema TRANSLOGIC S.A.
        </p>
        <div className="border-b-2 border-[#13235B] w-full" />
      </div>

      {/* Grid de Tarjetas (4 Columnas en escritorio, idéntico a la imagen) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
        {LISTA_CONSULTAS.map((item) => (
          <div
            key={item.key}
            onClick={() => onSelectConsulta(item.key)}
            className="bg-white border border-[#D5DAE6] p-6 flex flex-col justify-between hover:border-[#13235B] hover:shadow-md transition-all cursor-pointer group"
          >
            <div>
              {/* Punto Cuadrado Ámbar */}
              <span className="w-2 h-2 bg-[#F5A623] inline-block mb-3" />

              {/* Número Monumental */}
              <p className="font-display font-black text-4xl text-[#13235B] tracking-tight">
                {item.numero}
              </p>

              {/* Título en Negrita */}
              <h2 className="font-display font-black text-sm text-[#13235B] tracking-wide mt-4 mb-2 uppercase group-hover:text-[#DE9217] transition-colors">
                {item.titulo}
              </h2>

              {/* Descripción */}
              <p className="text-xs text-[#5B6480] font-sans leading-relaxed">
                {item.descripcion}
              </p>
            </div>

            {/* Separador y Tag Técnico Inferior */}
            <div className="mt-8 pt-4 border-t border-[#D5DAE6]">
              <span className="font-mono text-[10px] font-bold text-[#5B6480] uppercase tracking-widest block">
                {item.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

