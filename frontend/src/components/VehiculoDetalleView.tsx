import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, BatteryCharging, Fuel, ShieldCheck, Truck, Navigation, Calendar } from 'lucide-react';
import { api } from '../api/client';
import { Vehiculo, TipoVehiculo, EstadoVehiculo, ServicioTransporte } from '../types';

const FOTOS_VEHICULOS: Record<string, string> = {
  // Renault Master E-Tech (2023) - Furgoneta eléctrica de reparto
  'PBE-7744': 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=1000&q=80',
  // BYD T3 Electric (2024) - Furgoneta urbana 100% eléctrica
  'PBE-3310': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
  // Hino GH 1826 (2022) - Camión pesado de carga logística
  'PBA-1024': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1000&q=80',
  // Mercedes-Benz Atego 1726 (2023) - Camión de distribución de carga
  'PBA-5589': 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1000&q=80',
  // Isuzu Forward FTR (2024) - Camión de transporte pesado
  'PBA-9900': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80',
};

interface VehiculoDetalleViewProps {
  vehiculoId: string;
  onBack: () => void;
  onNavigateToEfficiency: (id: string) => void;
}

export const VehiculoDetalleView: React.FC<VehiculoDetalleViewProps> = ({
  vehiculoId,
  onBack,
  onNavigateToEfficiency,
}) => {
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [servicios, setServicios] = useState<ServicioTransporte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [vehiculoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resVehiculo, resServicios] = await Promise.all([
        api.getVehiculo(vehiculoId),
        api.getServicios(1, 10, undefined, undefined, vehiculoId),
      ]);
      setVehiculo(resVehiculo);
      setServicios(resServicios.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !vehiculo) {
    return (
      <div className="p-16 text-center text-xs font-mono text-[#5B6480]">
        Cargando ficha técnica y telemetría de la unidad...
      </div>
    );
  }

  const isCamion = vehiculo.tipo === TipoVehiculo.CAMION_CARGA;
  const camion = vehiculo.camionCarga;
  const furgoneta = vehiculo.furgonetaElectrica;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Botón de Retorno */}
      <div className="flex items-center justify-between border-b border-[#D5DAE6] pb-4">
        <button
          type="button"
          onClick={onBack}
          className="btn btn--outline h-9 px-3 text-xs font-mono font-bold flex items-center space-x-2 text-[#13235B] border-[#13235B] hover:bg-[#13235B] hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← VOLVER AL LISTADO DE VEHÍCULOS</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="accent-dot" />
          <span className="tag-mono">02 / FICHA TÉCNICA DEL VEHÍCULO</span>
        </div>
      </div>

      {/* Header Principal de la Unidad */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <span className="font-mono text-xs font-bold text-[#5B6480] uppercase tracking-widest block">
            PLACA VEHICULAR: {vehiculo.placa} &bull; AÑO {vehiculo.anio}
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#13235B] tracking-tight uppercase">
            {vehiculo.marca} {vehiculo.modelo}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`badge-corp text-xs px-3 py-1 font-bold ${
              vehiculo.estado === EstadoVehiculo.DISPONIBLE
                ? 'badge--disponible'
                : vehiculo.estado === EstadoVehiculo.EN_SERVICIO
                ? 'badge--alquilado'
                : 'badge--mora'
            }`}
          >
            ESTADO: {vehiculo.estado}
          </span>
          <button
            type="button"
            onClick={() => onNavigateToEfficiency(vehiculo.id)}
            className="btn btn--accent h-10 px-4 text-xs font-bold flex items-center space-x-1.5"
          >
            <Activity className="w-4 h-4" />
            <span>DIAGNÓSTICO TÉCNICO</span>
          </button>
        </div>
      </div>

      {/* Grid de Contenido Principal: Ilustración + Especificaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna 1 (5 cols): Tarjeta con Ilustración Gráfica del Vehículo */}
        <div className="lg:col-span-5 bg-white border border-[#D5DAE6] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#D5DAE6] pb-3">
              <span className="font-mono text-xs font-bold text-[#13235B] uppercase tracking-wider">
                IDENTIFICACIÓN VISUAL
              </span>
              <span className="tag-mono text-[10px] text-[#5B6480]">
                {isCamion ? 'COMBUSTIÓN DIÉSEL' : '100% ELÉCTRICO'}
              </span>
            </div>

            {/* Fotografía del Vehículo en Flota */}
            <div className="my-6 bg-[#F3F5FA] border border-[#D5DAE6] relative overflow-hidden">
              <div className="relative h-64 w-full bg-[#13235B]/10 flex items-center justify-center overflow-hidden">
                <img
                  src={
                    FOTOS_VEHICULOS[vehiculo.placa] ||
                    (isCamion ? FOTOS_VEHICULOS['PBA-5589'] : FOTOS_VEHICULOS['PBE-7744'])
                  }
                  alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  loading="eager"
                  className="w-full h-full object-cover object-center filter brightness-100 hover:scale-102 transition-all duration-300"
                  onError={(e) => {
                    // Fallback directo a CDN alternativo confiable
                    (e.target as HTMLImageElement).src = isCamion
                      ? 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1000&q=80'
                      : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80';
                  }}
                />
                <div className="absolute bottom-2 right-2 bg-[#F5A623] text-[#0D1A4A] font-mono text-[10px] font-black px-2.5 py-1 tracking-wider uppercase shadow-md">
                  {vehiculo.placa}
                </div>
              </div>

              <div className="p-3 bg-[#FAFBFD] border-t border-[#D5DAE6] flex items-center justify-between">
                <span className="font-mono text-[11px] font-black tracking-wider text-[#13235B] uppercase">
                  {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
                </span>
                <span className="tag-mono text-[10px] text-[#1E9E5A] font-bold flex items-center space-x-1">
                  {isCamion ? (
                    <span>DIÉSEL EURO V</span>
                  ) : (
                    <>
                      <BatteryCharging className="w-3.5 h-3.5" />
                      <span>100% ELÉCTRICA</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D5DAE6] text-xs font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#5B6480]">Placa de Circulación:</span>
              <strong className="text-[#13235B]">{vehiculo.placa}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5B6480]">Tipo de Propulsión:</span>
              <strong className="text-[#13235B]">{isCamion ? 'Diésel Combustión' : 'Batería Eléctrica Li-Ion'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5B6480]">Estado Operativo:</span>
              <strong className="text-[#1E9E5A]">{vehiculo.estado}</strong>
            </div>
          </div>
        </div>

        {/* Columna 2 (7 cols): Métricas Monumentales y Especificaciones Técnicas */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tarjetas Monumentales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#D5DAE6] p-5">
              <span className="font-mono text-[10px] font-bold text-[#5B6480] uppercase tracking-wider block">
                CAPACIDAD DE CARGA
              </span>
              <p className="font-display font-black text-2xl text-[#13235B] mt-2">
                {Number(vehiculo.capacidadCargaKg).toLocaleString()} <span className="text-sm font-normal">kg</span>
              </p>
              <span className="text-[10px] font-mono text-[#8D9AC0]">Límite técnico nominal</span>
            </div>

            <div className="bg-white border border-[#D5DAE6] p-5">
              <span className="font-mono text-[10px] font-bold text-[#5B6480] uppercase tracking-wider block">
                ODÓMETRO TOTAL
              </span>
              <p className="font-display font-black text-2xl text-[#13235B] mt-2">
                {Number(vehiculo.kilometraje).toLocaleString()} <span className="text-sm font-normal">km</span>
              </p>
              <span className="text-[10px] font-mono text-[#8D9AC0]">Actualizado en completados</span>
            </div>

            <div className="bg-white border border-[#D5DAE6] p-5">
              <span className="font-mono text-[10px] font-bold text-[#5B6480] uppercase tracking-wider block">
                {isCamion ? 'CONSUMO LITROS' : 'BATERÍA REMANENTE'}
              </span>
              <p className="font-display font-black text-2xl text-[#13235B] mt-2">
                {isCamion ? (
                  `${camion?.consumoLitros100Km || 28.5} L`
                ) : (
                  `${furgoneta?.porcentajeBateria || 90}%`
                )}
              </p>
              <span className="text-[10px] font-mono text-[#8D9AC0]">
                {isCamion ? 'Por cada 100 km' : `${furgoneta?.autonomiaKm || 300} km autonomía`}
              </span>
            </div>
          </div>

          {/* Ficha Técnica Detallada */}
          <div className="bg-white border border-[#D5DAE6] p-6 space-y-4">
            <h3 className="font-display font-black text-base text-[#13235B] tracking-wide uppercase border-b border-[#D5DAE6] pb-3">
              Especificaciones de Ingeniería y Costos Operativos
            </h3>

            {isCamion && camion ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-mono">
                <div>
                  <span className="text-[#5B6480] block">Consumo Diésel:</span>
                  <strong className="text-sm text-[#13235B]">{camion.consumoLitros100Km} L/100km</strong>
                </div>
                <div>
                  <span className="text-[#5B6480] block">Precio por Litro:</span>
                  <strong className="text-sm text-[#13235B]">${camion.precioLitro} USD</strong>
                </div>
                <div>
                  <span className="text-[#5B6480] block">Número de Ejes:</span>
                  <strong className="text-sm text-[#13235B]">{camion.numeroEjes} Ejes</strong>
                </div>
                <div>
                  <span className="text-[#5B6480] block">Mantenimiento por Km:</span>
                  <strong className="text-sm text-[#13235B]">${camion.costoMantenimientoKm} USD/km</strong>
                </div>
                <div>
                  <span className="text-[#5B6480] block">Recargo de Carga &gt;80%:</span>
                  <strong className="text-sm text-[#F5A623]">+8% sobre tarifa base</strong>
                </div>
                <div>
                  <span className="text-[#5B6480] block">Factor de Desgaste:</span>
                  <strong className="text-sm text-[#13235B]">1.25x en peajes</strong>
                </div>
              </div>
            ) : furgoneta ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-mono">
                <div>
                  <span className="text-[#5B6480] block">Capacidad de Batería:</span>
                  <strong className="text-sm text-[#13235B]">{furgoneta.capacidadBateriaKWh} kWh</strong>
                </div>
                <div>
                  <span className="text-[#5B6480] block">Consumo Eléctrico:</span>
                  <strong className="text-sm text-[#13235B]">{furgoneta.consumoKWh100Km} kWh/100km</strong>
                </div>
                <div>
                  <span className="text-[#5B6480] block">Costo por kWh:</span>
                  <strong className="text-sm text-[#13235B]">${furgoneta.costoKWh} USD</strong>
                </div>
                <div>
                  <span className="text-[#5B6480] block">Autonomía Teórica:</span>
                  <strong className="text-sm text-[#13235B]">{furgoneta.autonomiaKm} km</strong>
                </div>
                <div>
                  <span className="text-[#5B6480] block">Nivel de Batería Actual:</span>
                  <strong className="text-sm text-[#1E9E5A]">{furgoneta.porcentajeBateria}%</strong>
                </div>
                <div>
                  <span className="text-[#5B6480] block">Recargo Distancia &gt;80%:</span>
                  <strong className="text-sm text-[#F5A623]">+10% en batería crítica</strong>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Servicios Recientes Asignados a esta Unidad */}
      <div className="bg-white border border-[#D5DAE6]">
        <div className="p-4 bg-[#FAFBFD] border-b border-[#D5DAE6] flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[#13235B] uppercase tracking-wider flex items-center space-x-2">
            <Navigation className="w-3.5 h-3.5 text-[#5B6480]" />
            <span>DESPACHOS ASIGNADOS A ESTA UNIDAD ({servicios.length})</span>
          </span>
          <span className="text-[10px] font-mono text-[#5B6480]">Historial Operativo</span>
        </div>

        {servicios.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[#5B6480]">
            No hay despachos registrados para este vehículo.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="table-corp">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>CLIENTE</th>
                  <th>TRAYECTO</th>
                  <th>FECHA</th>
                  <th className="num">TARIFA</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((s) => (
                  <tr key={s.id}>
                    <td className="tag-mono font-bold text-[#13235B]">{s.codigo}</td>
                    <td>{s.cliente?.nombre || 'N/A'}</td>
                    <td className="text-xs">{s.origen} ➔ {s.destino} ({s.distanciaKm} km)</td>
                    <td className="tag-mono text-xs">{s.fecha} ({s.horaInicio})</td>
                    <td className="num font-bold text-xs text-[#13235B]">
                      ${Number(s.tarifaCalculada).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge-corp badge--disponible">{s.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

