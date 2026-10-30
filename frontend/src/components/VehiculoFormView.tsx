import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { TipoVehiculo, EstadoVehiculo, Vehiculo } from '../types';

interface VehiculoFormViewProps {
  vehiculoIdToEdit?: string | null;
  onBack: () => void;
  onSuccess: () => void;
}

export const VehiculoFormView: React.FC<VehiculoFormViewProps> = ({
  vehiculoIdToEdit,
  onBack,
  onSuccess,
}) => {
  const isEditing = Boolean(vehiculoIdToEdit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState(2023);
  const [capacidadCargaKg, setCapacidadCargaKg] = useState(5000);
  const [kilometraje, setKilometraje] = useState(0);
  const [tipo, setTipo] = useState<TipoVehiculo>(TipoVehiculo.CAMION_CARGA);
  const [estado, setEstado] = useState<EstadoVehiculo>(EstadoVehiculo.DISPONIBLE);

  // Camión
  const [consumoLitros, setConsumoLitros] = useState(22.5);
  const [precioLitro, setPrecioLitro] = useState(0.75);
  const [numeroEjes, setNumeroEjes] = useState(2);
  const [costoMantenimiento, setCostoMantenimiento] = useState(0.1);

  // Furgoneta Eléctrica
  const [capacidadBateria, setCapacidadBateria] = useState(75);
  const [consumoKWh, setConsumoKWh] = useState(20);
  const [costoKWh, setCostoKWh] = useState(0.09);
  const [autonomiaKm, setAutonomiaKm] = useState(300);
  const [porcentajeBateria, setPorcentajeBateria] = useState(90);

  useEffect(() => {
    if (vehiculoIdToEdit) {
      cargarVehiculo(vehiculoIdToEdit);
    }
  }, [vehiculoIdToEdit]);

  const cargarVehiculo = async (id: string) => {
    setLoading(true);
    try {
      const v = await api.getVehiculo(id);
      setPlaca(v.placa);
      setMarca(v.marca);
      setModelo(v.modelo);
      setAnio(v.anio);
      setCapacidadCargaKg(v.capacidadCargaKg);
      setKilometraje(v.kilometraje);
      setTipo(v.tipo);
      setEstado(v.estado);

      if (v.tipo === TipoVehiculo.CAMION_CARGA && v.camionCarga) {
        setConsumoLitros(v.camionCarga.consumoLitros100Km);
        setPrecioLitro(v.camionCarga.precioLitro);
        setNumeroEjes(v.camionCarga.numeroEjes);
        setCostoMantenimiento(v.camionCarga.costoMantenimientoKm);
      } else if (v.tipo === TipoVehiculo.FURGONETA_ELECTRICA && v.furgonetaElectrica) {
        setCapacidadBateria(v.furgonetaElectrica.capacidadBateriaKWh);
        setConsumoKWh(v.furgonetaElectrica.consumoKWh100Km);
        setCostoKWh(v.furgonetaElectrica.costoKWh);
        setAutonomiaKm(v.furgonetaElectrica.autonomiaKm);
        setPorcentajeBateria(v.furgonetaElectrica.porcentajeBateria);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar vehículo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        placa: placa.toUpperCase().trim(),
        marca,
        modelo,
        anio: Number(anio),
        capacidadCargaKg: Number(capacidadCargaKg),
        kilometraje: Number(kilometraje),
        tipo,
        estado,
      };

      if (tipo === TipoVehiculo.CAMION_CARGA) {
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

      if (isEditing && vehiculoIdToEdit) {
        await api.updateVehiculo(vehiculoIdToEdit, payload);
      } else {
        await api.createVehiculo(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al guardar los datos');
    } finally {
      setLoading(false);
    }
  };

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
          <span>Volver al Listado de Vehículos</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="accent-dot" />
          <span className="tag-mono">
            {isEditing ? `02 / EDITAR VEHÍCULO ${placa}` : '02 / REGISTRO DE VEHÍCULO NUEVO'}
          </span>
        </div>
      </div>

      {/* Cabecera de Página */}
      <div>
        <h1 className="text-2xl font-black text-[#13235B] tracking-tight">
          {isEditing ? `Modificar Vehículo [${placa}]` : 'Registrar Unidad en Flota'}
        </h1>
        <p className="text-xs text-[#5B6480] mt-1 font-mono">
          Estrategia polimórfica: parámetros de combustión o tren motriz 100% eléctrico
        </p>
      </div>

      {error && (
        <div className="p-4 bg-white border-l-4 border-[#C62828] border border-[#D5DAE6] text-[#C62828] text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Formulario Corporativo Brutalista (.form-card) */}
      <form onSubmit={handleSubmit} className="form-card space-y-6">
        {/* Selector de Tipo (Solo en creación) */}
        {!isEditing && (
          <div>
            <label className="label-corp">Tipo de Tren Motriz / Categoría</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTipo(TipoVehiculo.CAMION_CARGA)}
                className={`btn h-12 ${
                  tipo === TipoVehiculo.CAMION_CARGA
                    ? 'btn--accent'
                    : 'btn--outline bg-white'
                }`}
              >
                Camión de Carga (Combustión)
              </button>
              <button
                type="button"
                onClick={() => setTipo(TipoVehiculo.FURGONETA_ELECTRICA)}
                className={`btn h-12 ${
                  tipo === TipoVehiculo.FURGONETA_ELECTRICA
                    ? 'btn--accent'
                    : 'btn--outline bg-white'
                }`}
              >
                Furgoneta Eléctrica (Batería)
              </button>
            </div>
          </div>
        )}

        {/* Datos Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label-corp">Placa Única</label>
            <input
              type="text"
              required
              disabled={isEditing}
              placeholder="PBA-1024"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              className="input-corp font-mono uppercase font-bold"
            />
          </div>
          <div>
            <label className="label-corp">Marca</label>
            <input
              type="text"
              required
              placeholder="Hino / BYD"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="input-corp"
            />
          </div>
          <div>
            <label className="label-corp">Modelo</label>
            <input
              type="text"
              required
              placeholder="GH 1826 / T3"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="input-corp"
            />
          </div>
          <div>
            <label className="label-corp">Año Fabricación</label>
            <input
              type="number"
              required
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="input-corp num"
            />
          </div>
          <div>
            <label className="label-corp">Capacidad Autorizada (kg)</label>
            <input
              type="number"
              required
              value={capacidadCargaKg}
              onChange={(e) => setCapacidadCargaKg(Number(e.target.value))}
              className="input-corp num"
            />
          </div>
          <div>
            <label className="label-corp">Kilometraje Acumulado</label>
            <input
              type="number"
              required
              value={kilometraje}
              onChange={(e) => setKilometraje(Number(e.target.value))}
              className="input-corp num"
            />
          </div>
        </div>

        {/* Parámetros Específicos de Camión */}
        {tipo === TipoVehiculo.CAMION_CARGA && (
          <div className="border-t-2 border-[#13235B] pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="accent-dot" />
              <h3 className="text-xs font-bold text-[#13235B]">
                Ficha Técnica: Camión de Carga
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label-corp">Consumo (L / 100km)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={consumoLitros}
                  onChange={(e) => setConsumoLitros(Number(e.target.value))}
                  className="input-corp num"
                />
              </div>
              <div>
                <label className="label-corp">Precio Diésel ($/L)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={precioLitro}
                  onChange={(e) => setPrecioLitro(Number(e.target.value))}
                  className="input-corp num"
                />
              </div>
              <div>
                <label className="label-corp">Número de Ejes</label>
                <input
                  type="number"
                  required
                  value={numeroEjes}
                  onChange={(e) => setNumeroEjes(Number(e.target.value))}
                  className="input-corp num"
                />
              </div>
              <div>
                <label className="label-corp">Costo Mantenimiento ($/km)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={costoMantenimiento}
                  onChange={(e) => setCostoMantenimiento(Number(e.target.value))}
                  className="input-corp num"
                />
              </div>
            </div>
          </div>
        )}

        {/* Parámetros Específicos de Furgoneta Eléctrica */}
        {tipo === TipoVehiculo.FURGONETA_ELECTRICA && (
          <div className="border-t-2 border-[#13235B] pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="accent-dot" />
              <h3 className="text-xs font-bold text-[#13235B]">
                Ficha Técnica: Furgoneta Eléctrica
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label-corp">Capacidad Batería (kWh)</label>
                <input
                  type="number"
                  required
                  value={capacidadBateria}
                  onChange={(e) => setCapacidadBateria(Number(e.target.value))}
                  className="input-corp num"
                />
              </div>
              <div>
                <label className="label-corp">Consumo (kWh / 100km)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={consumoKWh}
                  onChange={(e) => setConsumoKWh(Number(e.target.value))}
                  className="input-corp num"
                />
              </div>
              <div>
                <label className="label-corp">Costo Electricidad ($/kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={costoKWh}
                  onChange={(e) => setCostoKWh(Number(e.target.value))}
                  className="input-corp num"
                />
              </div>
              <div>
                <label className="label-corp">Autonomía Nominal (km)</label>
                <input
                  type="number"
                  required
                  value={autonomiaKm}
                  onChange={(e) => setAutonomiaKm(Number(e.target.value))}
                  className="input-corp num"
                />
              </div>
              <div>
                <label className="label-corp">Carga Batería Actual (0-100%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={porcentajeBateria}
                  onChange={(e) => setPorcentajeBateria(Number(e.target.value))}
                  className="input-corp num"
                />
              </div>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#D5DAE6]">
          <button
            type="button"
            onClick={onBack}
            className="btn btn--outline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn--accent min-w-[180px]"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Guardando...' : isEditing ? 'Actualizar Ficha' : 'Guardar Unidad'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

