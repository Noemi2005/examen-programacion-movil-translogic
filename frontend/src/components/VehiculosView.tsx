import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Activity,
  Edit2,
  Eye,
} from 'lucide-react';
import { api } from '../api/client';
import { Vehiculo, TipoVehiculo, EstadoVehiculo, Usuario, RolUsuario } from '../types';
import { Pagination } from './Pagination';

interface VehiculosViewProps {
  currentUser: Usuario | null;
  onNavigateToCreate: () => void;
  onNavigateToEdit: (id: string) => void;
  onNavigateToEfficiency: (id: string) => void;
  onNavigateToDetail: (id: string) => void;
}

export const VehiculosView: React.FC<VehiculosViewProps> = ({
  currentUser,
  onNavigateToCreate,
  onNavigateToEdit,
  onNavigateToEfficiency,
  onNavigateToDetail,
}) => {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;

  const loadVehiculos = async () => {
    setLoading(true);
    try {
      const data = await api.getVehiculos(search, filterTipo, filterEstado);
      setVehiculos(data);
      setPage(1);
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

  const totalItems = vehiculos.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedVehiculos = vehiculos.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6">
      {/* Header Idéntico a la Imagen 1 */}
      <div className="space-y-1">
        <span className="font-mono text-xs font-bold text-[#5B6480] uppercase tracking-widest">
          02 / VEHÍCULOS
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#13235B]">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#13235B] tracking-tight uppercase">
            LISTADO DE VEHÍCULOS
          </h1>
          {currentUser?.rol === RolUsuario.ADMINISTRADOR && (
            <button
              type="button"
              onClick={onNavigateToCreate}
              className="btn bg-[#13235B] hover:bg-[#0D1A4A] text-white h-11 px-5 text-xs font-extrabold tracking-wider"
            >
              <span>AGREGAR NUEVO VEHÍCULO</span>
              <Plus className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 border border-[#D5DAE6] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            placeholder="BUSCAR POR PLACA, MARCA O MODELO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-corp pl-10 text-xs font-mono uppercase"
          />
          <Search className="w-4 h-4 text-[#5B6480] absolute left-3 top-3.5" />
        </form>

        <div className="flex gap-2">
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="input-corp text-xs font-mono w-auto"
          >
            <option value="">TODOS LOS TIPOS</option>
            <option value={TipoVehiculo.CAMION_CARGA}>CAMIONES DE CARGA</option>
            <option value={TipoVehiculo.FURGONETA_ELECTRICA}>FURGONETAS ELÉCTRICAS</option>
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="input-corp text-xs font-mono w-auto"
          >
            <option value="">TODOS LOS ESTADOS</option>
            <option value={EstadoVehiculo.DISPONIBLE}>DISPONIBLE</option>
            <option value={EstadoVehiculo.EN_SERVICIO}>EN SERVICIO</option>
            <option value={EstadoVehiculo.MANTENIMIENTO}>MANTENIMIENTO</option>
          </select>
        </div>
      </div>

      {/* Tabla Corporativa de Datos */}
      <div className="bg-white border border-[#D5DAE6] overflow-x-auto no-scrollbar shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-[#5B6480]">
            Cargando inventario de unidades...
          </div>
        ) : vehiculos.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[#5B6480]">
            No se encontraron unidades registradas en la flota.
          </div>
        ) : (
          <table className="table-corp">
            <thead>
              <tr>
                <th>PLACA</th>
                <th>MARCA / MODELO</th>
                <th>CATEGORÍA</th>
                <th className="num">CAPACIDAD</th>
                <th className="num">KILOMETRAJE</th>
                <th>ESTADO</th>
                <th style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVehiculos.map((v) => {
                const isCamion = v.tipo === TipoVehiculo.CAMION_CARGA;
                return (
                  <tr key={v.id}>
                    <td>
                      <strong className="tag-mono text-[#13235B] font-extrabold text-sm">
                        {v.placa}
                      </strong>
                    </td>
                    <td>
                      <span className="font-bold text-xs text-[#13235B]">{v.marca}</span>{' '}
                      <span className="text-[#5B6480] text-xs">
                        {v.modelo} ({v.anio})
                      </span>
                    </td>
                    <td>
                      <span className="tag-mono">
                        {isCamion ? 'CAMIÓN COMBUSTIÓN' : 'FURGONETA ELÉCTRICA'}
                      </span>
                    </td>
                    <td className="num font-bold text-[#13235B]">
                      {Number(v.capacidadCargaKg).toLocaleString()} kg
                    </td>
                    <td className="num font-bold text-[#5B6480]">
                      {Number(v.kilometraje).toLocaleString()} km
                    </td>
                    <td>
                      <span
                        className={`badge-corp ${
                          v.estado === EstadoVehiculo.DISPONIBLE
                            ? 'badge--disponible'
                            : v.estado === EstadoVehiculo.EN_SERVICIO
                            ? 'badge--alquilado'
                            : 'badge--mora'
                        }`}
                      >
                        {v.estado}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onNavigateToDetail(v.id)}
                          className="btn-icon btn-icon--secondary"
                          data-tooltip="Ver Ficha y Telemetría"
                          title="Ver Ficha y Telemetría"
                        >
                          <Eye className="w-4 h-4 text-[#13235B]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigateToEfficiency(v.id)}
                          className="btn-icon btn-icon--secondary"
                          data-tooltip="Diagnóstico"
                        >
                          <Activity className="w-4 h-4 text-[#13235B]" />
                        </button>

                        {currentUser?.rol === RolUsuario.ADMINISTRADOR && (
                          <button
                            type="button"
                            onClick={() => onNavigateToEdit(v.id)}
                            className="btn-icon btn-icon--secondary"
                            data-tooltip="Editar Ficha"
                          >
                            <Edit2 className="w-4 h-4 text-[#13235B]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación Corporativa */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={limit}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};
