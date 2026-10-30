import React, { useState, useEffect } from 'react';
import {
  Truck,
  Zap,
  Plus,
  Search,
  Activity,
  BatteryCharging,
  Gauge,
  Info,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';
import { Vehiculo, TipoVehiculo, EstadoVehiculo, Usuario, RolUsuario } from '../types';

interface VehiculosViewProps {
  currentUser: Usuario | null;
}

export const VehiculosView: React.FC<VehiculosViewProps> = ({ currentUser }) => {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEficiencia, setSelectedEficiencia] = useState<any | null>(null);
  const [loadingEficiencia, setLoadingEficiencia] = useState(false);

  // Form State
  const [tipoNuevo, setTipoNuevo] = useState<TipoVehiculo>(TipoVehiculo.CAMION_CARGA);
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState(2023);
  const [capacidadCargaKg, setCapacidadCargaKg] = useState(5000);
  const [kilometraje, setKilometraje] = useState(0);

  // Camión fields
  const [consumoLitros, setConsumoLitros] = useState(22);
  const [precioLitro, setPrecioLitro] = useState(0.75);
  const [numeroEjes, setNumeroEjes] = useState(2);
  const [costoMantenimiento, setCostoMantenimiento] = useState(0.1);

  // Furgoneta fields
  const [capacidadBateria, setCapacidadBateria] = useState(75);
  const [consumoKWh, setConsumoKWh] = useState(20);
  const [costoKWh, setCostoKWh] = useState(0.09);
  const [autonomiaKm, setAutonomiaKm] = useState(300);
  const [porcentajeBateria, setPorcentajeBateria] = useState(90);

  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadVehiculos = async () => {
    setLoading(true);
    try {
      const data = await api.getVehiculos(search, filterTipo, filterEstado);
      setVehiculos(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehiculos();
  }, [filterTipo, filterEstado]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVehiculos();
  };

  const handleVerEficiencia = async (id: string) => {
    setLoadingEficiencia(true);
    try {
      const data = await api.getEficienciaVehiculo(id);
      setSelectedEficiencia(data);
    } catch (err: any) {
      alert(err.message || 'Error al obtener eficiencia');
    } finally {
      setLoadingEficiencia(false);
    }
  };

  const handleCreateVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const payload: any = {
        placa: placa.toUpperCase(),
        marca,
        modelo,
        anio: Number(anio),
        capacidadCargaKg: Number(capacidadCargaKg),
        kilometraje: Number(kilometraje),
        tipo: tipoNuevo,
        estado: EstadoVehiculo.DISPONIBLE,
      };

      if (tipoNuevo === TipoVehiculo.CAMION_CARGA) {
        payload.camionCarga = {
          consumoLitros100Km: Number(consumoLitros),
          precioLitro: Number(precioLitro),
          numeroEjes: Number(numeroEjes),
          costoMantenimientoKm: Number(costoMantenimiento),
        };
      } else {
        payload.furgonetaElectrica = {
          capacidadBateriaKWh: Number(capacidadBateria),
          consumoKWh100Km: Number(consumoKWh),
          costoKWh: Number(costoKWh),
          autonomiaKm: Number(autonomiaKm),
          porcentajeBateria: Number(porcentajeBateria),
        };
      }

      await api.createVehiculo(payload);
      setShowCreateModal(false);
      setActionSuccess(`Vehículo con placa ${payload.placa} registrado exitosamente.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadVehiculos();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar vehículo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Truck className="w-6 h-6 text-blue-600" />
            <span>Gestión de Flota Vehicular</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Camiones de combustión y furgonetas eléctricas 100% polimórficos
          </p>
        </div>

        {currentUser?.rol === RolUsuario.ADMINISTRADOR && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Vehículo</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por placa (ej: PBA-1024), marca o modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex gap-2">
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value={TipoVehiculo.CAMION_CARGA}>Camión de Carga</option>
            <option value={TipoVehiculo.FURGONETA_ELECTRICA}>Furgoneta Eléctrica</option>
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value={EstadoVehiculo.DISPONIBLE}>Disponible</option>
            <option value={EstadoVehiculo.EN_SERVICIO}>En Servicio</option>
            <option value={EstadoVehiculo.MANTENIMIENTO}>Mantenimiento</option>
          </select>
        </div>
      </div>

      {/* Grid of Vehicles */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Cargando flota vehicular...</p>
        </div>
      ) : vehiculos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No se encontraron vehículos</h3>
          <p className="text-xs text-slate-500 mt-1">Prueba cambiando los filtros o la búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehiculos.map((v) => {
            const isCamion = v.tipo === TipoVehiculo.CAMION_CARGA;
            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                {/* Type Indicator Line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isCamion ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />

                <div>
                  <div className="flex items-start justify-between mb-3 mt-1">
                    <div>
                      <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider">
                        {v.placa}
                      </span>
                      <p className="text-xs text-slate-500 font-medium">
                        {v.marca} {v.modelo} ({v.anio})
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.estado === EstadoVehiculo.DISPONIBLE
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.estado === EstadoVehiculo.EN_SERVICIO
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {v.estado}
                    </span>
                  </div>

                  {/* Badges / Specs */}
                  <div className="grid grid-cols-2 gap-2 my-3 text-[11px]">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase">Capacidad</span>
                      <span className="font-semibold text-slate-800">
                        {Number(v.capacidadCargaKg).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase">Kilometraje</span>
                      <span className="font-semibold text-slate-800">
                        {Number(v.kilometraje).toLocaleString()} km
                      </span>
                    </div>
                  </div>

                  {/* Polymorphic Specifics */}
                  {isCamion && v.camionCarga && (
                    <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-2.5 text-[11px] space-y-1 mb-3">
                      <div className="flex justify-between text-amber-900">
                        <span>Consumo:</span>
                        <span className="font-semibold">{v.camionCarga.consumoLitros100Km} L/100km</span>
                      </div>
                      <div className="flex justify-between text-amber-900">
                        <span>Precio Diésel:</span>
                        <span className="font-semibold">${v.camionCarga.precioLitro}/L</span>
                      </div>
                      <div className="flex justify-between text-amber-900">
                        <span>Ejes:</span>
                        <span className="font-semibold">{v.camionCarga.numeroEjes} ejes</span>
                      </div>
                    </div>
                  )}

                  {!isCamion && v.furgonetaElectrica && (
                    <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-2.5 text-[11px] space-y-1 mb-3">
                      <div className="flex justify-between text-emerald-900">
                        <span>Batería Actual:</span>
                        <span className="font-semibold flex items-center space-x-1">
                          <BatteryCharging className="w-3.5 h-3.5 text-emerald-600 inline" />
                          <span>{v.furgonetaElectrica.porcentajeBateria}%</span>
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-900">
                        <span>Autonomía Nominal:</span>
                        <span className="font-semibold">{v.furgonetaElectrica.autonomiaKm} km</span>
                      </div>
                      <div className="flex justify-between text-emerald-900">
                        <span>Consumo:</span>
                        <span className="font-semibold">{v.furgonetaElectrica.consumoKWh100Km} kWh/100km</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <button
                  onClick={() => handleVerEficiencia(v.id)}
                  className="w-full mt-2 py-2 px-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>Evaluar Eficiencia</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Evaluar Eficiencia */}
      {selectedEficiencia && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Gauge className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Ficha de Eficiencia Operativa</h3>
              </div>
              <button
                onClick={() => setSelectedEficiencia(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Vehículo</span>
                  <p className="text-base font-bold text-slate-900">{selectedEficiencia.placa}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-slate-700">
                  {selectedEficiencia.tipo}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {selectedEficiencia.metricas.costoCombustibleKm !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Costo Combustible</span>
                    <span className="text-sm font-bold text-slate-800">
                      ${selectedEficiencia.metricas.costoCombustibleKm} / km
                    </span>
                  </div>
                )}
                {selectedEficiencia.metricas.costoTotalKm !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Costo Total Operativo</span>
                    <span className="text-sm font-bold text-slate-800">
                      ${selectedEficiencia.metricas.costoTotalKm} / km
                    </span>
                  </div>
                )}
                {selectedEficiencia.metricas.costoPorToneladaKm !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Por Tonelada - Km</span>
                    <span className="text-sm font-bold text-slate-800">
                      ${selectedEficiencia.metricas.costoPorToneladaKm}
                    </span>
                  </div>
                )}
                {selectedEficiencia.metricas.costoEnergiaKm !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Costo Eléctrico</span>
                    <span className="text-sm font-bold text-slate-800">
                      ${selectedEficiencia.metricas.costoEnergiaKm} / km
                    </span>
                  </div>
                )}
                {selectedEficiencia.metricas.autonomiaDisponibleKm !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Autonomía Disponible</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {selectedEficiencia.metricas.autonomiaDisponibleKm} km
                    </span>
                  </div>
                )}
              </div>

              {/* Diagnosis box */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start space-x-2">
                <Info className="w-4 h-4 flex-shrink-0 text-blue-600 mt-0.5" />
                <span>{selectedEficiencia.diagnostico}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Nuevo Vehículo (Solo Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Registrar Nuevo Vehículo en Flota</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehiculo} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Selector Tipo Polimórfico */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Vehículo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoNuevo(TipoVehiculo.CAMION_CARGA)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      tipoNuevo === TipoVehiculo.CAMION_CARGA
                        ? 'bg-amber-500 text-white border-amber-600 shadow'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Camión de Carga</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoNuevo(TipoVehiculo.FURGONETA_ELECTRICA)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      tipoNuevo === TipoVehiculo.FURGONETA_ELECTRICA
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Furgoneta Eléctrica</span>
                  </button>
                </div>
              </div>

              {/* General Fields */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Placa Única</label>
                  <input
                    type="text"
                    required
                    placeholder="PBA-1234"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Año</label>
                  <input
                    type="number"
                    required
                    value={anio}
                    onChange={(e) => setAnio(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Hino, BYD..."
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: GH 1826..."
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacidad Carga (kg)</label>
                  <input
                    type="number"
                    required
                    value={capacidadCargaKg}
                    onChange={(e) => setCapacidadCargaKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kilometraje Inicial</label>
                  <input
                    type="number"
                    required
                    value={kilometraje}
                    onChange={(e) => setKilometraje(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {/* Camión Specifics */}
              {tipoNuevo === TipoVehiculo.CAMION_CARGA && (
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase">Especificaciones del Camión</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium text-amber-800">Consumo (L/100km)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={consumoLitros}
                        onChange={(e) => setConsumoLitros(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-amber-800">Precio Diésel ($/L)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={precioLitro}
                        onChange={(e) => setPrecioLitro(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-amber-800">Número de Ejes</label>
                      <input
                        type="number"
                        required
                        value={numeroEjes}
                        onChange={(e) => setNumeroEjes(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-amber-800">Costo Mant. ($/km)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={costoMantenimiento}
                        onChange={(e) => setCostoMantenimiento(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Furgoneta Specifics */}
              {tipoNuevo === TipoVehiculo.FURGONETA_ELECTRICA && (
                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase">Especificaciones Furgoneta Eléctrica</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium text-emerald-800">Capacidad Batería (kWh)</label>
                      <input
                        type="number"
                        required
                        value={capacidadBateria}
                        onChange={(e) => setCapacidadBateria(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-emerald-800">Consumo (kWh/100km)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={consumoKWh}
                        onChange={(e) => setConsumoKWh(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-emerald-800">Autonomía Nominal (km)</label>
                      <input
                        type="number"
                        required
                        value={autonomiaKm}
                        onChange={(e) => setAutonomiaKm(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-emerald-800">Batería Actual (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={porcentajeBateria}
                        onChange={(e) => setPorcentajeBateria(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition-all"
              >
                Guardar Vehículo en Sistema
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
