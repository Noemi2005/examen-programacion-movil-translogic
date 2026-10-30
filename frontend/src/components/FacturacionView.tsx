import React, { useState, useEffect } from 'react';
import { Receipt, FileDown, Plus, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { api } from '../api/client';
import { Factura, Usuario, RolUsuario } from '../types';
import { Pagination } from './Pagination';
import { TicketPosModal } from './TicketPosModal';
import { FacturaDetalleModal } from './FacturaDetalleModal';

interface FacturacionViewProps {
  currentUser: Usuario | null;
  onNavigateToCreate: () => void;
}

export const FacturacionView: React.FC<FacturacionViewProps> = ({
  currentUser,
  onNavigateToCreate,
}) => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Factura | null>(null);
  const [selectedFacturaId, setSelectedFacturaId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 5;

  const loadFacturas = async () => {
    setLoading(true);
    try {
      const res = await api.getFacturas();
      setFacturas(res);
      setPage(1);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacturas();
  }, []);

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
      alert(err.message || 'Error al descargar PDF');
    }
  };

  const totalItems = facturas.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedFacturas = facturas.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6">
      {/* Header Idéntico a la Imagen 1 */}
      <div className="space-y-1">
        <span className="font-mono text-xs font-bold text-[#5B6480] uppercase tracking-widest">
          04 / FACTURACIÓN
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#13235B]">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#13235B] tracking-tight uppercase">
            LISTADO DE COMPROBANTES
          </h1>
          {currentUser?.rol === RolUsuario.ADMINISTRADOR && (
            <button
              type="button"
              onClick={onNavigateToCreate}
              className="btn bg-[#13235B] hover:bg-[#0D1A4A] text-white h-11 px-5 text-xs font-extrabold tracking-wider"
            >
              <span>EMITIR NUEVA FACTURA</span>
              <Plus className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* Tabla Corporativa */}
      <div className="bg-white border border-[#D5DAE6] overflow-x-auto shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-[#5B6480]">
            Cargando libro de comprobantes...
          </div>
        ) : facturas.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[#5B6480]">
            No hay facturas emitidas en el sistema.
          </div>
        ) : (
          <table className="table-corp">
            <thead>
              <tr>
                <th>N° FACTURA</th>
                <th>FECHA EMISIÓN</th>
                <th>CLIENTE</th>
                <th className="num">SUBTOTAL</th>
                <th className="num">RECARGOS</th>
                <th className="num">DESCUENTO</th>
                <th className="num">TOTAL (USD)</th>
                <th style={{ textAlign: 'right' }}>COMPROBANTE</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFacturas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <strong className="tag-mono text-[#13235B] font-extrabold text-sm">
                      {f.codigo}
                    </strong>
                  </td>
                  <td>
                    <span className="tag-mono text-xs text-[#5B6480]">
                      {new Date(f.fecha).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-xs text-[#13235B]">{f.cliente?.nombre || 'N/A'}</span>
                    <span className="tag-mono block text-[10px] text-[#5B6480]">
                      {f.cliente?.identificacion}
                    </span>
                  </td>
                  <td className="num font-bold text-xs text-[#13235B]">
                    ${Number(f.subtotal).toFixed(2)}
                  </td>
                  <td className="num font-bold text-xs text-[#F5A623]">
                    +${Number(f.recargos).toFixed(2)}
                  </td>
                  <td className="num font-bold text-xs text-[#1E9E5A]">
                    -${Number(f.descuento).toFixed(2)}
                  </td>
                  <td className="num font-black text-sm text-[#13235B]">
                    ${Number(f.total).toFixed(2)}
                  </td>
                  <td>
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedFacturaId(f.id)}
                        className="btn-icon btn-icon--secondary"
                        data-tooltip="Ver Detalle"
                        title="Ver Detalle de Factura"
                      >
                        <Eye className="w-4 h-4 text-[#13235B]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(f)}
                        className="btn-icon btn-icon--secondary"
                        data-tooltip="Ver Ticket POS"
                        title="Ver Ticket Maquinita POS"
                      >
                        <Receipt className="w-4 h-4 text-[#13235B]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDescargarPdf(f.id, f.codigo)}
                        className="btn-icon btn-icon--secondary"
                        data-tooltip="Descargar PDF"
                        title="Descargar PDF"
                      >
                        <FileDown className="w-4 h-4 text-[#13235B]" />
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

      {/* Modal Ticket POS Maquinita */}
      <TicketPosModal
        factura={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />

      {/* Modal Detalle Completo de Factura */}
      <FacturaDetalleModal
        facturaId={selectedFacturaId}
        onClose={() => setSelectedFacturaId(null)}
        onOpenTicket={(f) => {
          setSelectedFacturaId(null);
          setSelectedTicket(f);
        }}
        onDownloadPdf={handleDescargarPdf}
      />
    </div>
  );
};
