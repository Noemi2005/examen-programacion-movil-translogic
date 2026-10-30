import React, { useState, useEffect } from 'react';
import { ArrowLeft, Gauge, Activity, Battery, Fuel, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';

interface VehiculoEficienciaViewProps {
  vehiculoId: string;
  onBack: () => void;
}

export const VehiculoEficienciaView: React.FC<VehiculoEficienciaViewProps> = ({
  vehiculoId,
  onBack,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarEficiencia();
  }, [vehiculoId]);

  const cargarEficiencia = async () => {
    setLoading(true);
    try {
      const res = await api.getEficienciaVehiculo(vehiculoId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Error al obtener diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Botón de Retorno */}
      <div className="flex items-center justify-between border-b border-[#D5DAE6] pb-4">
        <button
          type="button"
          onClick={onBack}
          className="btn btn--outline text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Listado de Vehículos</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="accent-dot" />
          <span className="tag-mono">02 / FICHA TÉCNICA Y DIAGNÓSTICO</span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#5B6480]">
          Calculando diagnóstico operativo...
        </div>
      ) : error ? (
        <div className="p-4 bg-white border-l-4 border-[#C62828] text-[#C62828] text-xs">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-[#D5DAE6]">
            <div>
              <span className="tag-mono text-[#5B6480]">Placa Identificadora</span>
              <h1 className="text-3xl font-black font-mono text-[#13235B] tracking-wider mt-1">
                {data.placa}
              </h1>
              <p className="text-xs font-mono text-[#5B6480] mt-1 uppercase font-bold">
                Categoría: {data.tipo}
              </p>
            </div>

            <div className="p-4 border-2 border-[#13235B] bg-[#F3F5FA] max-w-md">
              <span className="tag-mono block text-[#13235B] font-bold">Diagnóstico Operativo:</span>
              <p className="text-xs text-[#13235B] font-medium mt-1">
                {data.diagnostico}
              </p>
            </div>
          </div>

          {/* Dark Panels con Métricas Monumentales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.metricas.costoCombustibleKm !== undefined && (
              <div className="dark-panel">
                <span className="section-tag block mb-2">01 / COMBUSTIBLE POR KM</span>
                <p className="total-monumental">${data.metricas.costoCombustibleKm}</p>
                <span className="tag-mono block mt-2 text-[#8D9AC0]">USD por kilómetro</span>
              </div>
            )}

            {data.metricas.costoTotalKm !== undefined && (
              <div className="dark-panel">
                <span className="section-tag block mb-2">02 / COSTO OPERATIVO KM</span>
                <p className="total-monumental">${data.metricas.costoTotalKm}</p>
                <span className="tag-mono block mt-2 text-[#8D9AC0]">Combustible + Mant.</span>
              </div>
            )}

            {data.metricas.costoPorToneladaKm !== undefined && (
              <div className="dark-panel">
                <span className="section-tag block mb-2">03 / COSTO TONELADA-KM</span>
                <p className="total-monumental">${data.metricas.costoPorToneladaKm}</p>
                <span className="tag-mono block mt-2 text-[#8D9AC0]">Eficiencia a plena carga</span>
              </div>
            )}

            {data.metricas.costoEnergiaKm !== undefined && (
              <div className="dark-panel">
                <span className="section-tag block mb-2">01 / COSTO ENERGÍA KM</span>
                <p className="total-monumental">${data.metricas.costoEnergiaKm}</p>
                <span className="tag-mono block mt-2 text-[#8D9AC0]">USD por kWh consumido</span>
              </div>
            )}

            {data.metricas.porcentajeBateriaActual !== undefined && (
              <div className="dark-panel">
                <span className="section-tag block mb-2">02 / ESTADO DE BATERÍA</span>
                <p className="total-monumental">{data.metricas.porcentajeBateriaActual}%</p>
                <span className="tag-mono block mt-2 text-[#8D9AC0]">Carga remanente disponible</span>
              </div>
            )}

            {data.metricas.autonomiaDisponibleKm !== undefined && (
              <div className="dark-panel">
                <span className="section-tag block mb-2">03 / AUTONOMÍA REAL</span>
                <p className="total-monumental">{data.metricas.autonomiaDisponibleKm} km</p>
                <span className="tag-mono block mt-2 text-[#8D9AC0]">
                  Nominal: {data.metricas.autonomiaNominalKm} km
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

