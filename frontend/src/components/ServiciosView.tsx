import React, { useState, useEffect } from 'react';
import {
  Plus,
  Truck,
  Play,
  CheckCheck,
  Ban,
  History,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { ServicioTransporte, EstadoServicio, Usuario } from '../types';
import { Pagination } from './Pagination';

interface ServiciosViewProps {
  currentUser: Usuario | null;
  onNavigateToCreate: () => void;
  onNavigateToAssign: (servicioId: string) => void;
}

export const ServiciosView: React.FC<ServiciosViewProps> = ({
  currentUser,
  onNavigateToCreate,
  onNavigateToAssign,
}) => {
  const [servicios, setServicios] = useState<ServicioTransporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;
  const [showHistorial, setShowHistorial] = useState<ServicioTransporte | null>(null);

  const loadServicios = async () => {
    setLoading(true);
    try {
      const res = await api.getServicios(page, limit, filtroEstado || undefined);
      setServicios(res.data);
      setTotalItems(res.total || res.data.length);
      setTotalPages(res.totalPages || Math.ceil((res.total || res.data.length) / limit));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServicios();
  }, [page, filtroEstado]);

  const handleCambiarEstado = async (id: string, nuevoEstado: EstadoServicio) => {
    if (!window.confirm(`¿Confirmar cambio de estado a '${nuevoEstado}'?`)) return;
    try {
      await api.actualizarEstadoServicio(id, nuevoEstado);
      loadServicios();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  const handleOpenHistorial = async (s: ServicioTransporte) => {
    setShowHistorial(s);
    try {
      const full = await api.getServicio(s.id);
      if (full) {
        setShowHistorial(full);
      }
    } catch (e) {
      console.error('Error al cargar historial completo:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Idéntico a la Imagen 1 */}
      <div className="space-y-1">
        <span className="font-mono text-xs font-bold text-[#5B6480] uppercase tracking-widest">
          03 / SERVICIOS
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#13235B]">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#13235B] tracking-tight uppercase">
            LISTADO DE SERVICIOS
          </h1>
          <button
            type="button"
            onClick={onNavigateToCreate}
            className="btn bg-[#13235B] hover:bg-[#0D1A4A] text-white h-11 px-5 text-xs font-extrabold tracking-wider"
          >
            <span>AGREGAR NUEVO SERVICIO</span>
            <Plus className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {['', EstadoServicio.PROGRAMADO, EstadoServicio.EN_EJECUCION, EstadoServicio.COMPLETADO, EstadoServicio.CANCELADO].map(
          (est) => (
            <button
              key={est}
              type="button"
              onClick={() => {
                setFiltroEstado(est);
                setPage(1);
              }}
              className={`btn text-xs h-10 ${
                filtroEstado === est
                  ? 'btn--accent'
                  : 'btn--outline bg-white'
              }`}
            >
              {est === '' ? 'TODOS LOS ESTADOS' : est}
            </button>
          ),
        )}
      </div>

      {/* Tabla Corporativa */}
      <div className="bg-white border border-[#D5DAE6] overflow-x-auto shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-[#5B6480]">
            Cargando servicios de transporte...
          </div>
        ) : servicios.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[#5B6480]">
            No hay despachos registrados bajo este criterio.
          </div>
        ) : (
          <table className="table-corp">
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>CLIENTE</th>
                <th>RUTA (ORIGEN ➔ DESTINO)</th>
                <th>FECHA / HORARIO</th>
                <th>UNIDAD</th>
                <th className="num">TARIFA</th>
                <th>ESTADO</th>
                <th style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong className="tag-mono text-[#13235B] font-extrabold text-sm">
                      {s.codigo}
                    </strong>
                    {s.facturado && (
                      <span className="block mt-1 badge-corp bg-[#13235B] text-[#F5A623] text-[9px]">
                        FACTURADO
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="font-bold text-xs text-[#13235B]">{s.cliente?.nombre || 'N/A'}</span>
                    <span className="tag-mono block text-[10px] text-[#5B6480]">
                      {s.cliente?.identificacion}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-semibold text-[#13235B]">{s.origen}</span>
                    <span className="text-[#5B6480] mx-1">➔</span>
                    <span className="text-xs font-semibold text-[#13235B]">{s.destino}</span>
                    <span className="tag-mono block text-[10px] text-[#5B6480]">
                      {s.distanciaKm} km | {s.pesoCargaKg} kg
                    </span>
                  </td>
                  <td>
                    <span className="tag-mono text-xs font-bold text-[#13235B] block">{s.fecha}</span>
                    <span className="tag-mono text-[10px] text-[#5B6480]">
                      {s.horaInicio} - {s.horaFinEstimada}
                    </span>
                  </td>
                  <td>
                    {s.vehiculo ? (
                      <div>
                        <strong className="tag-mono text-[#13235B] font-bold">{s.vehiculo.placa}</strong>
                        <span className="tag-mono block text-[10px] text-[#5B6480]">{s.vehiculo.marca}</span>
                      </div>
                    ) : (
                      <span className="badge-corp badge--finalizado">SIN ASIGNAR</span>
                    )}
                  </td>
                  <td className="num font-bold text-sm text-[#13235B]">
                    ${Number(s.tarifaCalculada).toFixed(2)}
                  </td>
                  <td>
                    <span
                      className={`badge-corp ${
                        s.estado === EstadoServicio.COMPLETADO
                          ? 'badge--disponible'
                          : s.estado === EstadoServicio.EN_EJECUCION
                          ? 'badge--alquilado'
                          : s.estado === EstadoServicio.PROGRAMADO
                          ? 'badge--activo'
                          : 'badge--mora'
                      }`}
                    >
                      {s.estado}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end space-x-1.5">
                      {!s.vehiculo && s.estado === EstadoServicio.PROGRAMADO && (
                        <button
                          type="button"
                          onClick={() => onNavigateToAssign(s.id)}
                          className="btn-icon btn-icon--accent"
                          data-tooltip="Asignar Unidad"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      )}

                      {s.estado === EstadoServicio.PROGRAMADO && s.vehiculo && (
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(s.id, EstadoServicio.EN_EJECUCION)}
                          className="btn-icon btn-icon--secondary"
                          data-tooltip="Iniciar Despacho"
                        >
                          <Play className="w-4 h-4 text-[#13235B]" />
                        </button>
                      )}

                      {s.estado === EstadoServicio.EN_EJECUCION && (
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(s.id, EstadoServicio.COMPLETADO)}
                          className="btn-icon btn-icon--accent"
                          data-tooltip="Completar Servicio"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      )}

                      {(s.estado === EstadoServicio.PROGRAMADO || s.estado === EstadoServicio.EN_EJECUCION) && (
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(s.id, EstadoServicio.CANCELADO)}
                          className="btn-icon btn-icon--danger"
                          data-tooltip="Cancelar"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenHistorial(s)}
                        className="btn-icon btn-icon--secondary"
                        data-tooltip="Auditoría"
                      >
                        <History className="w-4 h-4 text-[#13235B]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Modal Auditoría */}
      {showHistorial && (
        <div className="fixed inset-0 z-50 bg-[#0D1A4A]/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-2 border-[#13235B] p-6 space-y-4 shadow-[8px_8px_0_#13235B]">
            <div className="flex items-center justify-between border-b border-[#D5DAE6] pb-3">
              <div className="flex items-center space-x-2">
                <span className="accent-dot" />
                <h3 className="text-sm font-bold font-mono text-[#13235B]">
                  AUDITORÍA DE ESTADOS - {showHistorial.codigo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistorial(null)}
                className="btn-icon btn-icon--secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {showHistorial.historialEstados && showHistorial.historialEstados.length > 0 ? (
                showHistorial.historialEstados.map((h, i) => (
                  <div key={h.id || i} className="p-3 bg-[#F3F5FA] border border-[#D5DAE6] text-xs font-mono">
                    <div className="flex justify-between font-bold text-[#13235B]">
                      <span>{h.estadoAnterior} ➔ {h.estadoNuevo}</span>
                      <span className="text-[#5B6480]">
                        {new Date(h.fecha).toLocaleDateString()} {new Date(h.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#5B6480] mt-1 pt-1 border-t border-[#D5DAE6]/60">
                      <span>Responsable: <strong className="text-[#13235B]">{h.usuario?.nombre || 'Usuario en Turno'}</strong></span>
                      {h.usuario?.rol && (
                        <span className="px-1.5 py-0.5 bg-[#13235B] text-white text-[9px] font-bold">
                          {h.usuario.rol}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs font-mono text-[#5B6480]">
                  Cargando registros de auditoría...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
