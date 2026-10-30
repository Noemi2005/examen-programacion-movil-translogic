import React, { useState, useEffect } from 'react';
import { ArrowLeft, Receipt, Check, AlertCircle, Save } from 'lucide-react';
import { api } from '../api/client';
import { Cliente, ServicioTransporte, EstadoServicio } from '../types';

interface FacturaFormViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const FacturaFormView: React.FC<FacturaFormViewProps> = ({ onBack, onSuccess }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [serviciosDisponibles, setServiciosDisponibles] = useState<ServicioTransporte[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const res = await api.getClientes();
      setClientes(res);
      if (res.length > 0) {
        setClienteId(res[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar clientes');
    }
  };

  useEffect(() => {
    if (clienteId) {
      cargarServicios(clienteId);
    }
  }, [clienteId]);

  const cargarServicios = async (cId: string) => {
    setCargandoServicios(true);
    setSelectedIds([]);
    try {
      const res = await api.getServicios(1, 100, EstadoServicio.COMPLETADO, cId);
      const noFacturados = res.data.filter((s: ServicioTransporte) => !s.facturado);
      setServiciosDisponibles(noFacturados);
    } catch (err: any) {
      setError(err.message || 'Error al cargar servicios del cliente');
    } finally {
      setCargandoServicios(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Cálculo en vivo
  const calcularDesglose = () => {
    const seleccionados = serviciosDisponibles.filter((s) => selectedIds.includes(s.id));
    let subtotal = 0;
    let recargos = 0;

    for (const s of seleccionados) {
      const tarifa = Number(s.tarifaCalculada);
      let r = 0;
      if (Number(s.distanciaKm) > 300) r += tarifa * 0.06;
      const fechaObj = new Date(`${s.fecha}T12:00:00Z`);
      if (fechaObj.getUTCDay() === 0) r += tarifa * 0.12;

      subtotal += tarifa;
      recargos += r;
    }

    const cantidad = seleccionados.length;
    let descPct = 0;
    if (cantidad >= 6) descPct = 0.10;
    else if (cantidad >= 3) descPct = 0.05;

    const baseConRecargos = subtotal + recargos;
    const descuento = Math.round(baseConRecargos * descPct * 100) / 100;
    const baseImponible = baseConRecargos - descuento;
    const impuesto = Math.round(baseImponible * 0.15 * 100) / 100; // IVA 15%
    const total = Math.round((baseImponible + impuesto) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      recargos: Math.round(recargos * 100) / 100,
      descuento,
      descuentoPct: descPct * 100,
      impuesto,
      total,
    };
  };

  const desglose = calcularDesglose();

  const handleEmitirFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError('Debes seleccionar al menos un servicio completado para facturar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.createFactura({
        clienteId,
        serviciosIds: selectedIds,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al emitir factura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Retorno */}
      <div className="flex items-center justify-between border-b border-[#D5DAE6] pb-4">
        <button
          type="button"
          onClick={onBack}
          className="btn btn--outline text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Listado de Facturas</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="accent-dot" />
          <span className="tag-mono">04 / EMISIÓN DE FACTURA SIMULADA</span>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-black text-[#13235B] tracking-tight">
          Liquidación y Facturación de Servicios
        </h1>
        <p className="text-xs text-[#5B6480] mt-1 font-mono">
          Operación atómica: exclusividad de servicios completados, recargos y descuento mensual
        </p>
      </div>

      {error && (
        <div className="p-4 bg-white border-l-4 border-[#C62828] border border-[#D5DAE6] text-[#C62828] text-xs flex items-center space-x-2 font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleEmitirFactura} className="space-y-6">
        <div className="form-card space-y-6">
          <div>
            <label className="label-corp">Cliente a Facturar</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="input-corp"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} [{c.identificacion}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-corp">
              Servicios Completados Pendientes de Facturación ({serviciosDisponibles.length} disponibles)
            </label>

            {cargandoServicios ? (
              <p className="text-xs font-mono text-[#5B6480] py-4">Buscando despachos...</p>
            ) : serviciosDisponibles.length === 0 ? (
              <div className="p-4 bg-white border border-[#D5DAE6] text-xs font-mono text-[#5B6480]">
                El cliente seleccionado no tiene servicios completados pendientes de cobro.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {serviciosDisponibles.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSelect(s.id)}
                      className={`p-3.5 border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-[#13235B] text-white border-[#13235B]'
                          : 'bg-white text-[#13235B] border-[#D5DAE6] hover:border-[#13235B]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 accent-[#F5A623]"
                        />
                        <div>
                          <span className="font-mono font-bold tracking-wider">{s.codigo}</span>
                          <span className={`block text-[11px] ${isSelected ? 'text-[#8D9AC0]' : 'text-[#5B6480]'}`}>
                            {s.origen} ➔ {s.destino} ({s.distanciaKm} km) | {s.fecha}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-sm">
                          ${Number(s.tarifaCalculada).toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dark Panel Monumental con el Total de la Factura */}
        <div className="dark-panel grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="section-tag block">01 / SUBTOTAL BASE</span>
            <p className="text-2xl font-black font-mono text-white">
              ${desglose.subtotal.toFixed(2)}
            </p>
            <span className="tag-mono text-[#8D9AC0]">
              {selectedIds.length} despachos seleccionados
            </span>
          </div>

          <div className="space-y-1">
            <span className="section-tag block">02 / RECARGOS (&gt;300KM / DOM)</span>
            <p className="text-2xl font-black font-mono text-[#F5A623]">
              +${desglose.recargos.toFixed(2)}
            </p>
            <span className="tag-mono text-[#8D9AC0]">+6% distancia / +12% domingo</span>
          </div>

          <div className="space-y-1">
            <span className="section-tag block">03 / DESCUENTO VOLUMEN</span>
            <p className="text-2xl font-black font-mono text-[#1E9E5A]">
              {desglose.descuento > 0 ? `-$${desglose.descuento.toFixed(2)}` : '$0.00'}
            </p>
            <span className="tag-mono text-[#8D9AC0]">
              {desglose.descuentoPct > 0 ? `${desglose.descuentoPct}% aplicado por volumen (>3 despachos)` : '0% (aplica con >3 despachos)'}
            </span>
          </div>

          <div className="space-y-1 md:text-right border-t md:border-t-0 md:border-l border-[#2B3C7A] pt-4 md:pt-0 md:pl-6">
            <span className="section-tag block">TOTAL A FACTURAR (IVA 15%)</span>
            <p className="total-monumental text-[#F5A623]">
              ${desglose.total.toFixed(2)}
            </p>
            <span className="tag-mono text-[#8D9AC0]">USD Total a Pagar</span>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button type="button" onClick={onBack} className="btn btn--outline">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || selectedIds.length === 0}
            className="btn btn--accent min-w-[220px]"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Emitiendo comprobante...' : 'Emitir Factura Atómica'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

