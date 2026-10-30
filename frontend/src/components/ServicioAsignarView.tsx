import React, { useState, useEffect } from 'react';
import { ArrowLeft, Truck, Check, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { ServicioTransporte, Vehiculo } from '../types';
import { alerts } from '../utils/alerts';

interface ServicioAsignarViewProps {
  servicioId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const ServicioAsignarView: React.FC<ServicioAsignarViewProps> = ({
  servicioId,
  onBack,
  onSuccess,
}) => {
  const [servicio, setServicio] = useState<ServicioTransporte | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [selectedVehiculoId, setSelectedVehiculoId] = useState('');
  const [recargaPlanificada, setRecargaPlanificada] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [servicioId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [s, v] = await Promise.all([
        api.getServicios(1, 1, undefined, undefined, undefined), // or find one
        api.getVehiculos(),
      ]);
      // find exact service
      const resServicio = await api.getServicios(1, 100);
      const target = resServicio.data.find((item: any) => item.id === servicioId);
      setServicio(target || null);
      setVehiculos(v);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehiculoId) {
      await alerts.showWarning('Selección Requerida', 'Debes seleccionar un vehículo de la flota para este despacho.');
      setError('Debes seleccionar un vehículo');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.asignarVehiculo(servicioId, selectedVehiculoId, recargaPlanificada);
      await alerts.showSuccess('¡Unidad Asignada!', 'El vehículo ha sido asignado al servicio correctamente.');
      onSuccess();
    } catch (err: any) {
      const msg = err.message || 'Conflicto en la asignación del vehículo';
      setError(msg);
      await alerts.showError('Conflicto de Asignación', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-[#5B6480]">
        Cargando servicio y flota...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Botón de Retorno */}
      <div className="flex items-center justify-between border-b border-[#D5DAE6] pb-4">
        <button
          type="button"
          onClick={onBack}
          className="btn btn--outline text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Servicios</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="accent-dot" />
          <span className="tag-mono">03 / CONTROL DE ASIGNACIÓN CONCURRENTE</span>
        </div>
      </div>

      {servicio && (
        <div className="bg-white p-6 border border-[#D5DAE6] space-y-3">
          <span className="tag-mono">DESPACHO SELECCIONADO</span>
          <h1 className="text-2xl font-black font-mono text-[#13235B]">
            {servicio.codigo}
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-[#5B6480] pt-2 border-t border-[#D5DAE6]">
            <div>Fecha: <strong className="text-[#13235B]">{servicio.fecha}</strong></div>
            <div>Horario: <strong className="text-[#13235B]">{servicio.horaInicio} - {servicio.horaFinEstimada}</strong></div>
            <div>Distancia: <strong className="text-[#13235B]">{servicio.distanciaKm} km</strong></div>
            <div>Peso: <strong className="text-[#13235B]">{servicio.pesoCargaKg} kg</strong></div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-white border-l-4 border-[#C62828] border border-[#D5DAE6] text-[#C62828] text-xs flex items-center space-x-2 font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleAsignar} className="form-card space-y-4">
        <label className="label-corp">Seleccionar Unidad Disponible de la Flota:</label>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {vehiculos.map((v) => {
            const isSelected = selectedVehiculoId === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVehiculoId(v.id)}
                className={`p-4 border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#13235B] text-white border-[#13235B]'
                    : 'bg-white text-[#13235B] border-[#D5DAE6] hover:border-[#13235B]'
                }`}
              >
                <div>
                  <span className="font-mono text-sm font-extrabold tracking-wider">{v.placa}</span>
                  <span className={`text-xs block mt-0.5 ${isSelected ? 'text-[#8D9AC0]' : 'text-[#5B6480]'}`}>
                    {v.marca} {v.modelo} | {v.tipo} | Capacidad: {v.capacidadCargaKg} kg
                  </span>
                </div>
                {isSelected && <Check className="w-5 h-5 text-[#F5A623]" />}
              </div>
            );
          })}
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="recargaAsig"
            checked={recargaPlanificada}
            onChange={(e) => setRecargaPlanificada(e.target.checked)}
            className="w-4 h-4 accent-[#13235B]"
          />
          <label htmlFor="recargaAsig" className="text-xs font-mono font-bold text-[#13235B]">
            Planificar recarga intermedia registrada para vehículos eléctricos
          </label>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#D5DAE6]">
          <button type="button" onClick={onBack} className="btn btn--outline">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedVehiculoId}
            className="btn btn--accent min-w-[200px]"
          >
            {submitting ? 'Asignando con bloqueo...' : 'Confirmar Asignación'}
          </button>
        </div>
      </form>
    </div>
  );
};

