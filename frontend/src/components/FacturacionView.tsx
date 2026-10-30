import React, { useState, useEffect } from 'react';
import {
  Receipt,
  FileDown,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { api } from '../api/client';
import { Factura, Cliente, ServicioTransporte, EstadoServicio, Usuario, RolUsuario } from '../types';

interface FacturacionViewProps {
  currentUser: Usuario | null;
}

export const FacturacionView: React.FC<FacturacionViewProps> = ({ currentUser }) => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Nueva Factura
  const [showModal, setShowModal] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [serviciosDisponibles, setServiciosDisponibles] = useState<ServicioTransporte[]>([]);
  const [selectedServiciosIds, setSelectedServiciosIds] = useState<string[]>([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [generando, setGenerando] = useState(false);

  // Alertas
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resFacturas, resClientes] = await Promise.all([
        api.getFacturas(),
        api.getClientes(),
      ]);
      setFacturas(resFacturas);
      setClientes(resClientes);
      if (resClientes.length > 0 && !selectedClienteId) {
        setSelectedClienteId(resClientes[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cargar servicios completados no facturados cuando cambia el cliente seleccionado
  useEffect(() => {
    if (selectedClienteId && showModal) {
      loadServiciosCompletados(selectedClienteId);
    }
  }, [selectedClienteId, showModal]);

  const loadServiciosCompletados = async (clienteId: string) => {
    setCargandoServicios(true);
    setSelectedServiciosIds([]);
    try {
      const res = await api.getServicios(1, 100, EstadoServicio.COMPLETADO, clienteId);
      // Filtrar no facturados
      const noFacturados = res.data.filter((s: ServicioTransporte) => !s.facturado);
      setServiciosDisponibles(noFacturados);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCargandoServicios(false);
    }
  };

  const toggleSelectServicio = (id: string) => {
    if (selectedServiciosIds.includes(id)) {
      setSelectedServiciosIds(selectedServiciosIds.filter((item) => item !== id));
    } else {
      setSelectedServiciosIds([...selectedServiciosIds, id]);
    }
  };

  // Cálculo de desglose simulado en vivo para la vista
  const calcularDesgloseEnVivo = () => {
    const serviciosSeleccionados = serviciosDisponibles.filter((s) =>
      selectedServiciosIds.includes(s.id),
    );

    let subtotal = 0;
    let recargos = 0;

    for (const s of serviciosSeleccionados) {
      const tarifa = Number(s.tarifaCalculada);
      let r = 0;
      if (Number(s.distanciaKm) > 300) r += tarifa * 0.06;
      const fechaObj = new Date(`${s.fecha}T12:00:00Z`);
      if (fechaObj.getUTCDay() === 0) r += tarifa * 0.12;

      subtotal += tarifa;
      recargos += r;
    }

    // Regla descuento por cliente en el mes
    const cantidad = serviciosSeleccionados.length;
    let descPct = 0;
    if (cantidad >= 6) descPct = 0.10;
    else if (cantidad >= 3) descPct = 0.05;

    const importeConRecargos = subtotal + recargos;
    const descuento = Math.round(importeConRecargos * descPct * 100) / 100;
    const base = importeConRecargos - descuento;
    const impuesto = Math.round(base * 0.15 * 100) / 100; // IVA 15%
    const total = Math.round((base + impuesto) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      recargos: Math.round(recargos * 100) / 100,
      descuento,
      descuentoPct: descPct * 100,
      impuesto,
      total,
    };
  };

  const desglose = calcularDesgloseEnVivo();

  const handleGenerarFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServiciosIds.length === 0) {
      setActionError('Debes seleccionar al menos un servicio completado.');
      return;
    }

    setGenerando(true);
    setActionError(null);
    try {
      const facturaCreada = await api.createFactura({
        clienteId: selectedClienteId,
        serviciosIds: selectedServiciosIds,
      });
      setShowModal(false);
      setActionSuccess(`Factura ${facturaCreada.codigo} emitida exitosamente por $${facturaCreada.total} USD.`);
      setTimeout(() => setActionSuccess(null), 5000);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Error al emitir factura');
    } finally {
      setGenerando(false);
    }
  };

  const handleDescargarPdf = async (id: string, codigo: string) => {
    try {
      const blob = await api.descargarFacturaPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura-Simulada-${codigo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Error al descargar comprobante');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>Módulo de Facturación y Comprobantes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Facturación atómica, recargos (&gt;300km/domingos), descuentos por volumen y PDF simulado
          </p>
        </div>

        {currentUser?.rol === RolUsuario.ADMINISTRADOR && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Factura</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Facturas emitidas */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Cargando facturas emitidas...</p>
        </div>
      ) : facturas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No hay facturas emitidas</h3>
          <p className="text-xs text-slate-500 mt-1">
            Completa servicios para poder emitir comprobantes a los clientes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facturas.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-sm font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {f.codigo}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {new Date(f.fecha).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                    ${Number(f.total).toFixed(2)} USD
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cliente</span>
                  <p className="text-xs font-bold text-slate-800">{f.cliente?.nombre || 'N/A'}</p>
                  <p className="text-[11px] text-slate-500">{f.cliente?.identificacion}</p>
                </div>

                {/* Desglose resumido */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Base:</span>
                    <span>${Number(f.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(f.recargos) > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Recargos (+6%/+12%):</span>
                      <span>+${Number(f.recargos).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(f.descuento) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Descuento Aplicado:</span>
                      <span>-${Number(f.descuento).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>IVA (15%):</span>
                    <span>${Number(f.impuesto).toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  <span>Ítems facturados: </span>
                  <strong className="text-slate-800">{f.detalles?.length || 0} servicios</strong>
                </div>
              </div>

              {/* Botón de Descarga PDF */}
              <button
                onClick={() => handleDescargarPdf(f.id, f.codigo)}
                className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
              >
                <FileDown className="w-4 h-4 text-rose-400" />
                <span>Descargar PDF Simulado</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Emitir Factura */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-blue-400" />
                <span>Generar Factura Atómica</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerarFactura} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente</label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.identificacion})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de Servicios completados no facturados */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seleccionar Servicios Completados a Facturar:
                </label>

                {cargandoServicios ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Buscando servicios...</p>
                ) : serviciosDisponibles.length === 0 ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                    El cliente no tiene servicios en estado <strong>COMPLETADO</strong> pendientes de facturación.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {serviciosDisponibles.map((s) => {
                      const isSelected = selectedServiciosIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleSelectServicio(s.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div>
                            <span className="font-mono font-bold">{s.codigo}</span>
                            <span className="text-[11px] block opacity-80">
                              {s.origen} ➔ {s.destino} ({s.distanciaKm} km)
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">${Number(s.tarifaCalculada).toFixed(2)} USD</span>
                            <span className="text-[10px] block opacity-80">{s.fecha}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desglose en vivo de la liquidación Req-04 */}
              {selectedServiciosIds.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase text-[11px] border-b pb-1">
                    Liquidación Simulada
                  </h4>
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Base ({selectedServiciosIds.length} servicios):</span>
                    <span>${desglose.subtotal.toFixed(2)}</span>
                  </div>
                  {desglose.recargos > 0 && (
                    <div className="flex justify-between text-amber-700 font-medium">
                      <span>Recargos aplicados (&gt;300km / domingos):</span>
                      <span>+${desglose.recargos.toFixed(2)}</span>
                    </div>
                  )}
                  {desglose.descuento > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Descuento Frecuencia ({desglose.descuentoPct}%):</span>
                      <span>-${desglose.descuento.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Impuesto IVA (15%):</span>
                    <span>${desglose.impuesto.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-blue-900 border-t pt-2">
                    <span>Total de la Factura:</span>
                    <span>${desglose.total.toFixed(2)} USD</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={generando || selectedServiciosIds.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition-all"
              >
                {generando ? 'Generando Comprobante...' : 'Emitir Factura y Comprobante PDF'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
