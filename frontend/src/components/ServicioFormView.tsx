import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, Save, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { Vehiculo, Cliente, SimulacionTarifaResponse } from '../types';
import { ClienteCombobox } from './ClienteCombobox';
import { alerts } from '../utils/alerts';

interface ServicioFormViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ServicioFormView: React.FC<ServicioFormViewProps> = ({ onBack, onSuccess }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fecha de hoy en formato YYYY-MM-DD
  const hoyStr = new Date().toISOString().slice(0, 10);

  // Form Fields (Código manejado internamente por el sistema)
  const [clienteId, setClienteId] = useState('');
  const [vehiculoId, setVehiculoId] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [distanciaKm, setDistanciaKm] = useState(140);
  const [pesoCargaKg, setPesoCargaKg] = useState(3500);
  const [fecha, setFecha] = useState(hoyStr);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFinEstimada, setHoraFinEstimada] = useState('14:30');
  const [recargaPlanificada, setRecargaPlanificada] = useState(false);

  // Simulador en vivo
  const [simulacion, setSimulacion] = useState<SimulacionTarifaResponse | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [simulacionError, setSimulacionError] = useState<string | null>(null);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [resClientes, resVehiculos] = await Promise.all([
        api.getClientes(),
        api.getVehiculos(),
      ]);
      setClientes(resClientes);
      setVehiculos(resVehiculos);
      if (resClientes.length > 0) setClienteId(resClientes[0].id);
    } catch (err: any) {
      setError(err.message || 'Error al cargar catálogos');
    }
  };

  useEffect(() => {
    if (vehiculoId && distanciaKm > 0 && pesoCargaKg > 0) {
      cotizarEnVivo();
    } else {
      setSimulacion(null);
    }
  }, [vehiculoId, distanciaKm, pesoCargaKg, recargaPlanificada]);

  const cotizarEnVivo = async () => {
    setSimulando(true);
    setSimulacionError(null);
    try {
      const res = await api.simularTarifa({
        vehiculoId,
        distanciaKm: Number(distanciaKm),
        pesoCargaKg: Number(pesoCargaKg),
        recargaPlanificada,
      });
      setSimulacion(res);
    } catch (err: any) {
      setSimulacion(null);
      setSimulacionError(err.message || 'Error en cotización');
    } finally {
      setSimulando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación de fecha no menor a la actual
    if (fecha < hoyStr) {
      setError('La fecha de despacho no puede ser anterior a la fecha actual');
      return;
    }

    // Validación de horas coherentes
    if (horaFinEstimada <= horaInicio) {
      setError('La hora de finalización debe ser posterior a la hora de inicio');
      return;
    }

    setLoading(true);

    // Código generado automáticamente por el sistema
    const codigoInterno = `SRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await api.createServicio({
        codigo: codigoInterno,
        clienteId,
        vehiculoId: vehiculoId || undefined,
        origen,
        destino,
        distanciaKm: Number(distanciaKm),
        pesoCargaKg: Number(pesoCargaKg),
        fecha,
        horaInicio,
        horaFinEstimada,
        recargaPlanificada,
      });
      await alerts.showSuccess('¡Despacho Planificado!', `El servicio ha sido registrado correctamente.`);
      onSuccess();
    } catch (err: any) {
      const msg = err.message || 'Error al crear servicio';
      setError(msg);
      await alerts.showError('Error de Planificación', msg);
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
          className="btn btn--outline h-9 px-3 text-xs font-mono font-bold flex items-center space-x-2 text-[#13235B] border-[#13235B] hover:bg-[#13235B] hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← VOLVER AL LISTADO DE SERVICIOS</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="accent-dot" />
          <span className="tag-mono">03 / PLANIFICAR NUEVO SERVICIO</span>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-black text-[#13235B] tracking-tight uppercase">
          Planificación y Cotización de Despacho
        </h1>
        <p className="text-xs text-[#5B6480] mt-1 font-mono">
          Reglas del servidor: validación de horas no solapadas, capacidad y recálculo obligatorio
        </p>
      </div>

      {error && (
        <div className="p-4 bg-white border-l-4 border-[#C62828] border border-[#D5DAE6] text-[#C62828] text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-card space-y-6">
          {/* Fila 1: Cliente con Combobox Buscador en Vivo */}
          <div>
            <ClienteCombobox
              clientes={clientes}
              selectedClienteId={clienteId}
              onSelectCliente={(id) => setClienteId(id)}
              required
            />
          </div>

          {/* Fila 2: Origen y Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-corp">Lugar de Origen</label>
              <input
                type="text"
                required
                placeholder="Terminal de Carga Norte - Quito"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                className="input-corp"
              />
            </div>
            <div>
              <label className="label-corp">Lugar de Destino</label>
              <input
                type="text"
                required
                placeholder="Bodega Central - Guayaquil"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="input-corp"
              />
            </div>
          </div>

          {/* Fila 3: Distancia, Peso, Fecha y Horas (con validación de fecha no vieja) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label-corp">Distancia (km)</label>
              <input
                type="number"
                min="1"
                required
                value={distanciaKm}
                onChange={(e) => setDistanciaKm(Number(e.target.value))}
                className="input-corp num"
              />
            </div>
            <div>
              <label className="label-corp">Peso Carga (kg)</label>
              <input
                type="number"
                min="1"
                required
                value={pesoCargaKg}
                onChange={(e) => setPesoCargaKg(Number(e.target.value))}
                className="input-corp num"
              />
            </div>
            <div>
              <label className="label-corp">Fecha Despacho</label>
              <input
                type="date"
                min={hoyStr}
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="input-corp"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-corp">Hora Inicio</label>
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="input-corp font-mono text-center"
                />
              </div>
              <div>
                <label className="label-corp">Hora Fin</label>
                <input
                  type="time"
                  required
                  value={horaFinEstimada}
                  onChange={(e) => setHoraFinEstimada(e.target.value)}
                  className="input-corp font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Sección de Asignación y Simulación en Vivo */}
          <div className="border-t border-[#D5DAE6] pt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="accent-dot" />
              <h2 className="text-sm font-bold font-mono text-[#13235B] uppercase">
                Asignación de Vehículo y Cotización en Vivo (Req-02)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="label-corp">Unidad Asignada</label>
                <select
                  value={vehiculoId}
                  onChange={(e) => setVehiculoId(e.target.value)}
                  className="input-corp"
                >
                  <option value="">-- Dejar sin asignar temporalmente --</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.placa} - {v.marca} {v.modelo} ({v.tipo.replace('_', ' ')}) - Cap: {v.capacidadCargaKg}kg
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recargaPlanificada}
                    onChange={(e) => setRecargaPlanificada(e.target.checked)}
                    className="checkbox-corp"
                  />
                  <span className="text-xs text-[#13235B] font-mono">
                    Planificar recarga intermedia en ruta (para furgonetas eléctricas)
                  </span>
                </label>
              </div>
            </div>

            {/* Panel de Simulación / Alertas */}
            {simulando && (
              <div className="p-4 bg-white border border-[#D5DAE6] text-xs font-mono text-[#5B6480] text-center animate-pulse">
                Calculando tarifa polimórfica en servidor...
              </div>
            )}

            {simulacionError && (
              <div className="p-4 bg-white border-l-4 border-[#C62828] border border-[#D5DAE6] text-[#C62828] text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{simulacionError}</span>
              </div>
            )}

            {simulacion && (
              <div className="bg-white border-2 border-[#13235B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#D5DAE6] pb-2">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4 text-[#F5A623]" />
                    <span className="font-mono text-xs font-bold text-[#13235B] uppercase">
                      Desglose de Cotización Polimórfica
                    </span>
                  </div>
                  {simulacion.recargoAplicadoDescripcion && (
                    <span className="text-[11px] font-mono text-[#F5A623] font-bold">
                      {simulacion.recargoAplicadoDescripcion}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[#5B6480] block">Tarifa Base:</span>
                    <strong className="text-[#13235B] text-sm">${Number(simulacion.tarifaBase).toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[#5B6480] block">Recargos Aplicados:</span>
                    <strong className="text-[#13235B] text-sm">${Number(simulacion.recargos).toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[#5B6480] block">Costo Directo Ruta:</span>
                    <strong className="text-[#13235B] text-sm">${Number(simulacion.costoDirecto).toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[#5B6480] block">Costo Operativo Estimado:</span>
                    <strong className="text-[#8D9AC0] text-sm">${Number(simulacion.costoOperativo).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#D5DAE6] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#13235B] uppercase">
                    Tarifa Final a Facturar:
                  </span>
                  <span className="text-2xl font-black text-[#13235B] font-display">
                    ${simulacion.tarifaFinal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="btn btn--outline h-11 px-5 text-xs font-bold"
          >
            CANCELAR
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn--accent h-11 px-6 text-xs font-bold flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'REGISTRANDO...' : 'CONFIRMAR Y GUARDAR'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
