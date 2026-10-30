import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Truck,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  X,
  Play,
  CheckCheck,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api/client';
import {
  ServicioTransporte,
  Vehiculo,
  Cliente,
  EstadoServicio,
  Usuario,
  SimulacionTarifaResponse,
} from '../types';

interface ServiciosViewProps {
  currentUser: Usuario | null;
}

export const ServiciosView: React.FC<ServiciosViewProps> = ({ currentUser }) => {
  const [servicios, setServicios] = useState<ServicioTransporte[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState<ServicioTransporte | null>(null);
  const [showHistorialModal, setShowHistorialModal] = useState<ServicioTransporte | null>(null);
  const [confirmEstadoAction, setConfirmEstadoAction] = useState<{
    servicio: ServicioTransporte;
    nuevoEstado: EstadoServicio;
  } | null>(null);

  // Form State Nuevo Servicio
  const [codigo, setCodigo] = useState(`SRV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [clienteId, setClienteId] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [distanciaKm, setDistanciaKm] = useState(120);
  const [pesoCargaKg, setPesoCargaKg] = useState(3000);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFinEstimada, setHoraFinEstimada] = useState('14:00');
  const [vehiculoSeleccionadoId, setVehiculoSeleccionadoId] = useState('');
  const [recargaPlanificada, setRecargaPlanificada] = useState(false);

  // Live simulation
  const [simulacion, setSimulacion] = useState<SimulacionTarifaResponse | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [simulacionError, setSimulacionError] = useState<string | null>(null);

  // Alerts
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resServicios, resVehiculos, resClientes] = await Promise.all([
        api.getServicios(page, 10, filtroEstado),
        api.getVehiculos(),
        api.getClientes(),
      ]);
      setServicios(resServicios.data);
      setTotalPages(resServicios.totalPages || 1);
      setVehiculos(resVehiculos);
      setClientes(resClientes);
      if (resClientes.length > 0 && !clienteId) {
        setClienteId(resClientes[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filtroEstado]);

  // Ejecutar simulación automática cuando cambia vehículo, distancia o peso
  useEffect(() => {
    if (vehiculoSeleccionadoId && distanciaKm > 0 && pesoCargaKg > 0) {
      simularTarifaEnVivo();
    } else {
      setSimulacion(null);
    }
  }, [vehiculoSeleccionadoId, distanciaKm, pesoCargaKg, recargaPlanificada]);

  const simularTarifaEnVivo = async () => {
    setSimulando(true);
    setSimulacionError(null);
    try {
      const res = await api.simularTarifa({
        vehiculoId: vehiculoSeleccionadoId,
        distanciaKm: Number(distanciaKm),
        pesoCargaKg: Number(pesoCargaKg),
        recargaPlanificada,
      });
      setSimulacion(res);
    } catch (err: any) {
      setSimulacion(null);
      setSimulacionError(err.message || 'Error al cotizar');
    } finally {
      setSimulando(false);
    }
  };

  const handleCreateServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await api.createServicio({
        codigo,
        clienteId,
        vehiculoId: vehiculoSeleccionadoId || undefined,
        origen,
        destino,
        distanciaKm: Number(distanciaKm),
        pesoCargaKg: Number(pesoCargaKg),
        fecha,
        horaInicio,
        horaFinEstimada,
        recargaPlanificada,
      });
      setShowCreateModal(false);
      setActionSuccess(`Servicio ${codigo} registrado correctamente.`);
      setTimeout(() => setActionSuccess(null), 4000);
      setCodigo(`SRV-2026-${Math.floor(100 + Math.random() * 900)}`);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Error al registrar servicio');
    }
  };

  const handleAsignarVehiculo = async (vehiculoId: string, recarga: boolean) => {
    if (!showAsignarModal) return;
    setActionError(null);
    try {
      await api.asignarVehiculo(showAsignarModal.id, vehiculoId, recarga);
      setShowAsignarModal(null);
      setActionSuccess(`Vehículo asignado exitosamente al servicio ${showAsignarModal.codigo}`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Error al asignar vehículo');
    }
  };

  const handleCambiarEstado = async () => {
    if (!confirmEstadoAction) return;
    const { servicio, nuevoEstado } = confirmEstadoAction;
    setActionError(null);
    try {
      await api.actualizarEstadoServicio(servicio.id, nuevoEstado);
      setConfirmEstadoAction(null);
      setActionSuccess(`Servicio ${servicio.codigo} actualizado a '${nuevoEstado}'`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Error al cambiar estado');
      setConfirmEstadoAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CalendarCheck className="w-6 h-6 text-blue-600" />
            <span>Servicios de Transporte y Despachos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Programación horaria estricta, control de solapamiento y recálculo en servidor
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Planificar Servicio</span>
        </button>
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

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {['', EstadoServicio.PROGRAMADO, EstadoServicio.EN_EJECUCION, EstadoServicio.COMPLETADO, EstadoServicio.CANCELADO].map(
          (est) => (
            <button
              key={est}
              onClick={() => {
                setFiltroEstado(est);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filtroEstado === est
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {est === '' ? 'Todos los Estados' : est}
            </button>
          ),
        )}
      </div>

      {/* Services List / Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Cargando despachos de transporte...</p>
        </div>
      ) : servicios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No hay servicios registrados</h3>
          <p className="text-xs text-slate-500 mt-1">Crea un nuevo servicio con el botón superior.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {servicios.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:border-slate-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    {s.codigo}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.estado === EstadoServicio.PROGRAMADO
                        ? 'bg-amber-100 text-amber-800'
                        : s.estado === EstadoServicio.EN_EJECUCION
                        ? 'bg-blue-100 text-blue-800'
                        : s.estado === EstadoServicio.COMPLETADO
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {s.estado}
                  </span>
                  {s.facturado && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      FACTURADO
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-700 font-medium">
                  <span className="font-semibold text-slate-900">{s.origen}</span>
                  <span className="text-slate-400 mx-1.5">➔</span>
                  <span className="font-semibold text-slate-900">{s.destino}</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span>
                    Cliente: <strong className="text-slate-700">{s.cliente?.nombre || 'N/A'}</strong>
                  </span>
                  <span>
                    Fecha: <strong className="text-slate-700">{s.fecha} ({s.horaInicio} - {s.horaFinEstimada})</strong>
                  </span>
                  <span>
                    Distancia: <strong className="text-slate-700">{s.distanciaKm} km</strong>
                  </span>
                  <span>
                    Carga: <strong className="text-slate-700">{s.pesoCargaKg} kg</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-xs text-slate-500">Vehículo:</span>
                  {s.vehiculo ? (
                    <span className="text-xs font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                      <Truck className="w-3 h-3 text-blue-600 inline" />
                      <span>{s.vehiculo.placa} ({s.vehiculo.marca})</span>
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Sin asignar
                    </span>
                  )}

                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-slate-500">Tarifa:</span>
                  <span className="text-xs font-bold text-slate-900">
                    ${Number(s.tarifaCalculada).toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 border-t md:border-t-0 pt-3 md:pt-0">
                {!s.vehiculo && s.estado === EstadoServicio.PROGRAMADO && (
                  <button
                    onClick={() => setShowAsignarModal(s)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Asignar</span>
                  </button>
                )}

                {s.estado === EstadoServicio.PROGRAMADO && s.vehiculo && (
                  <button
                    onClick={() =>
                      setConfirmEstadoAction({ servicio: s, nuevoEstado: EstadoServicio.EN_EJECUCION })
                    }
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Iniciar</span>
                  </button>
                )}

                {s.estado === EstadoServicio.EN_EJECUCION && (
                  <button
                    onClick={() =>
                      setConfirmEstadoAction({ servicio: s, nuevoEstado: EstadoServicio.COMPLETADO })
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Completar</span>
                  </button>
                )}

                {(s.estado === EstadoServicio.PROGRAMADO || s.estado === EstadoServicio.EN_EJECUCION) && (
                  <button
                    onClick={() =>
                      setConfirmEstadoAction({ servicio: s, nuevoEstado: EstadoServicio.CANCELADO })
                    }
                    className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                )}

                <button
                  onClick={() => setShowHistorialModal(s)}
                  title="Auditoría de Estados"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Servicio con Simulador en Vivo */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span>Planificar Servicio & Simulación de Tarifa</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateServicio} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código de Servicio</label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cliente Solicitante</label>
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.identificacion})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lugar de Origen</label>
                  <input
                    type="text"
                    required
                    placeholder="Quito Norte"
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lugar de Destino</label>
                  <input
                    type="text"
                    required
                    placeholder="Guayaquil Puerto"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Distancia (km)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={distanciaKm}
                    onChange={(e) => setDistanciaKm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peso de la Carga (kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pesoCargaKg}
                    onChange={(e) => setPesoCargaKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha Programada</label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hora Inicio</label>
                    <input
                      type="text"
                      placeholder="08:00"
                      required
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hora Fin Estimada</label>
                    <input
                      type="text"
                      placeholder="14:00"
                      required
                      value={horaFinEstimada}
                      onChange={(e) => setHoraFinEstimada(e.target.value)}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Selector de Vehículo con Simulación en Vivo */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seleccionar Vehículo (Opcional en registro o inmediato)
                </label>
                <select
                  value={vehiculoSeleccionadoId}
                  onChange={(e) => setVehiculoSeleccionadoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="">-- Asignar más adelante --</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.placa} - {v.marca} {v.modelo} [{v.tipo}] ({v.capacidadCargaKg} kg max)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  id="recarga"
                  checked={recargaPlanificada}
                  onChange={(e) => setRecargaPlanificada(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="recarga" className="text-slate-600 font-medium">
                  Registrar recarga planificada en ruta (para vehículos eléctricos)
                </label>
              </div>

              {/* Box de Simulación de Tarifa Req-02 */}
              {vehiculoSeleccionadoId && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                      <Calculator className="w-3.5 h-3.5 text-blue-600" />
                      <span>Simulación de Tarifa (Req-02)</span>
                    </span>
                    {simulando && (
                      <span className="text-[10px] text-blue-600 font-medium animate-pulse">
                        Cotizando...
                      </span>
                    )}
                  </div>

                  {simulacionError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{simulacionError}</span>
                    </div>
                  )}

                  {simulacion && (
                    <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                      <div className="flex justify-between">
                        <span>Costo Operativo Estimado:</span>
                        <strong className="text-slate-800">${simulacion.costoOperativo.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tarifa Base:</span>
                        <strong className="text-slate-800">${simulacion.tarifaBase.toFixed(2)}</strong>
                      </div>
                      {simulacion.recargos > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>{simulacion.recargoAplicadoDescripcion}:</span>
                          <strong>+${simulacion.recargos.toFixed(2)}</strong>
                        </div>
                      )}
                      {simulacion.autonomiaDisponibleKm !== undefined && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Autonomía Eléctrica Disponible:</span>
                          <strong>{simulacion.autonomiaDisponibleKm} km</strong>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-blue-900 border-t border-slate-200 pt-2">
                        <span>Tarifa Final Calculada:</span>
                        <span>${simulacion.tarifaFinal.toFixed(2)} USD</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={Boolean(vehiculoSeleccionadoId && simulacionError)}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition-all"
              >
                Confirmar y Registrar Servicio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Vehículo */}
      {showAsignarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Asignar Vehículo a {showAsignarModal.codigo}
              </h3>
              <button onClick={() => setShowAsignarModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Fecha: <strong>{showAsignarModal.fecha}</strong> | Horario:{' '}
              <strong>
                {showAsignarModal.horaInicio} - {showAsignarModal.horaFinEstimada}
              </strong>
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {vehiculos.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleAsignarVehiculo(v.id, false)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900">{v.placa}</span>
                    <span className="text-[11px] text-slate-500 block">
                      {v.marca} {v.modelo} ({v.tipo})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Capacidad: {v.capacidadCargaKg} kg
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Operación Crítica (Cambio de Estado) */}
      {confirmEstadoAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">¿Confirmar cambio de estado?</h3>
              <p className="text-xs text-slate-500 mt-1">
                El servicio <strong>{confirmEstadoAction.servicio.codigo}</strong> cambiará a{' '}
                <strong className="text-blue-600">{confirmEstadoAction.nuevoEstado}</strong>.
              </p>
              {confirmEstadoAction.nuevoEstado === EstadoServicio.COMPLETADO && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg mt-2 font-medium">
                  Se actualizará automáticamente el kilometraje del vehículo asignado exactamente una vez.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmEstadoAction(null)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCambiarEstado}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-md shadow-blue-500/20"
              >
                Sí, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial de Auditoría */}
      {showHistorialModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>Auditoría de Estados - {showHistorialModal.codigo}</span>
              </h3>
              <button onClick={() => setShowHistorialModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {showHistorialModal.historialEstados && showHistorialModal.historialEstados.length > 0 ? (
                showHistorialModal.historialEstados.map((h, i) => (
                  <div key={h.id || i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {h.estadoAnterior} ➔ {h.estadoNuevo}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Usuario responsable: <strong>{h.usuario?.nombre || 'Operador en turno'}</strong>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Sin historial adicional registrado.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
