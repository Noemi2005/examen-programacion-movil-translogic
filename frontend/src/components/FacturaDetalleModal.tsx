import React, { useState, useEffect } from 'react';
import { X, Receipt, FileDown, Truck, Calendar, MapPin, CheckCircle, Package } from 'lucide-react';
import { Factura } from '../types';
import { api } from '../api/client';

interface FacturaDetalleModalProps {
  facturaId: string | null;
  onClose: () => void;
  onOpenTicket: (f: Factura) => void;
  onDownloadPdf: (id: string, codigo: string) => void;
}

export const FacturaDetalleModal: React.FC<FacturaDetalleModalProps> = ({
  facturaId,
  onClose,
  onOpenTicket,
  onDownloadPdf,
}) => {
  const [factura, setFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facturaId) {
      setFactura(null);
      return;
    }

    const fetchDetalle = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getFactura(facturaId);
        setFactura(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar detalles de la factura');
      } finally {
        setLoading(false);
      }
    };

    fetchDetalle();
  }, [facturaId]);

  if (!facturaId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D1A4A]/80 backdrop-blur-xs p-4 sm:p-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#13235B] w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: 0 }}
      >
        {/* Cabecera Corporativa Fija (Siempre visible arriba) */}
        <div className="shrink-0 bg-[#13235B] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#0D1A4A]">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-[#F5A623] shrink-0" />
            <div>
              <span className="font-mono text-[10px] text-[#8D9AC0] font-bold tracking-widest block uppercase">
                COMPROBANTE ELECTRÓNICO OFICIAL
              </span>
              <h2 className="font-display font-black text-lg sm:text-xl text-white tracking-wide uppercase">
                DETALLE DE FACTURA: {factura?.codigo || 'CARGANDO...'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 hover:bg-[#0D1A4A] transition-colors border border-white/20"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con Scroll Interno Suave */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="p-16 text-center font-mono text-xs text-[#5B6480]">
              Cargando desglose de la factura y servicios liquidados...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-xs font-mono text-[#C62828]">
              {error}
            </div>
          ) : factura ? (
            <>
              {/* Metadatos: Emisor y Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F3F5FA] border border-[#D5DAE6] p-4 sm:p-5">
                {/* Emisor */}
                <div className="space-y-1">
                  <span className="tag-mono text-[10px] text-[#5B6480] uppercase tracking-wider block">
                    EMISOR / OPERADOR LOGÍSTICO
                  </span>
                  <h3 className="font-display font-black text-base text-[#13235B]">
                    TRANSLOGIC S.A.
                  </h3>
                  <div className="font-mono text-xs text-[#5B6480] space-y-0.5">
                    <p>R.U.C.: <strong className="text-[#13235B]">1792345678001</strong></p>
                    <p>Dirección: Av. Galo Plaza Lasso N64-12 y Panamericana Norte, Quito</p>
                    <p>Email: facturacion@translogic.ec</p>
                  </div>
                </div>

                {/* Cliente */}
                <div className="space-y-1">
                  <span className="tag-mono text-[10px] text-[#5B6480] uppercase tracking-wider block">
                    CLIENTE / DESTINATARIO
                  </span>
                  <h3 className="font-display font-black text-base text-[#13235B]">
                    {factura.cliente?.nombre || 'Consumidor Final'}
                  </h3>
                  <div className="font-mono text-xs text-[#5B6480] space-y-0.5">
                    <p>R.U.C. / C.I.: <strong className="text-[#13235B]">{factura.cliente?.identificacion}</strong></p>
                    <p>Email: {factura.cliente?.correo || 'N/A'}</p>
                    <p>Teléfono: {factura.cliente?.telefono || 'N/A'}</p>
                    <p>Fecha Emisión: <strong className="text-[#13235B]">{new Date(factura.fecha).toLocaleDateString()}</strong></p>
                  </div>
                </div>
              </div>

              {/* Listado de Despachos / Servicios Liquidados */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#D5DAE6] mb-3">
                  <span className="font-mono text-xs font-bold text-[#13235B] uppercase tracking-wider flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-[#F5A623]" />
                    <span>SERVICIOS DE TRANSPORTE LIQUIDADOS ({factura.detalles?.length || 0})</span>
                  </span>
                  <span className="tag-mono text-[10px] text-[#1E9E5A] font-bold">
                    AUTORIZADO &bull; VALIDADOS
                  </span>
                </div>

                <div className="border border-[#D5DAE6] overflow-x-auto no-scrollbar">
                  <table className="table-corp">
                    <thead>
                      <tr>
                        <th>CÓDIGO</th>
                        <th>ORIGEN &rarr; DESTINO</th>
                        <th>UNIDAD / PLACA</th>
                        <th className="num">DISTANCIA</th>
                        <th className="num">TARIFA BASE</th>
                        <th className="num">RECARGOS</th>
                        <th className="num">TOTAL LÍNEA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {factura.detalles && factura.detalles.length > 0 ? (
                        factura.detalles.map((d: any) => {
                          const srv = d.servicio;
                          const subTotalLinea = Number(d.tarifa) + Number(d.recargos);
                          return (
                            <tr key={d.id}>
                              <td>
                                <span className="tag-mono font-bold text-[#13235B]">
                                  {srv?.codigo || 'SRV-N/A'}
                                </span>
                              </td>
                              <td>
                                <div className="text-xs font-semibold text-[#13235B]">
                                  {srv?.origen} &rarr; {srv?.destino}
                                </div>
                                <span className="tag-mono text-[10px] text-[#5B6480] block">
                                  Carga: {srv?.pesoCargaKg ? `${srv.pesoCargaKg} kg` : 'N/A'}
                                </span>
                              </td>
                              <td>
                                <span className="font-mono text-xs font-bold text-[#13235B] block">
                                  {srv?.vehiculo?.placa || 'N/A'}
                                </span>
                                <span className="text-[10px] text-[#5B6480]">
                                  {srv?.vehiculo?.marca} {srv?.vehiculo?.modelo}
                                </span>
                              </td>
                              <td className="num font-mono text-xs text-[#13235B]">
                                {srv?.distanciaKm ? `${srv.distanciaKm} km` : '-'}
                              </td>
                              <td className="num font-mono text-xs text-[#13235B]">
                                ${Number(d.tarifa).toFixed(2)}
                              </td>
                              <td className="num font-mono text-xs text-[#F5A623]">
                                +${Number(d.recargos).toFixed(2)}
                              </td>
                              <td className="num font-mono text-xs font-bold text-[#13235B]">
                                ${subTotalLinea.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center p-4 font-mono text-xs text-[#5B6480]">
                            No se registraron líneas de detalle.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Desglose Contable y Resumen Fiscal */}
              <div className="flex flex-col sm:flex-row justify-end items-stretch gap-6 pt-2">
                <div className="w-full sm:w-80 bg-[#0D1A4A] text-white p-5 border-t-4 border-[#F5A623] space-y-2 font-mono">
                  <div className="flex justify-between text-xs text-[#8D9AC0]">
                    <span>SUBTOTAL BASE:</span>
                    <span className="text-white font-bold">${Number(factura.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#8D9AC0]">
                    <span>RECARGOS (&gt;300KM / DOM):</span>
                    <span className="text-[#F5A623] font-bold">+${Number(factura.recargos).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#8D9AC0]">
                    <span>DESCUENTO VOLUMEN:</span>
                    <span className="text-[#1E9E5A] font-bold">-${Number(factura.descuento).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#8D9AC0]">
                    <span>IVA SRI (15%):</span>
                    <span className="text-white font-bold">${Number(factura.impuesto).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/20 pt-2 flex justify-between items-baseline">
                    <span className="font-display font-black text-xs tracking-wider text-[#F5A623]">
                      TOTAL A PAGAR:
                    </span>
                    <span className="font-display font-black text-2xl text-white">
                      ${Number(factura.total).toFixed(2)} <span className="text-xs font-normal text-[#8D9AC0]">USD</span>
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Fijo con Acciones (Siempre visible al pie) */}
        {factura && (
          <div className="shrink-0 bg-[#F3F5FA] border-t border-[#D5DAE6] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#5B6480]">
              <CheckCircle className="w-4 h-4 text-[#1E9E5A] shrink-0" />
              <span className="hidden sm:inline">Comprobante validado en base de datos PostgreSQL</span>
            </div>

            <div className="flex items-center space-x-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTicket(factura);
                }}
                className="btn btn--accent h-9 sm:h-10 px-3 sm:px-4 text-xs font-extrabold flex items-center space-x-1.5"
              >
                <Receipt className="w-4 h-4" />
                <span>TICKET POS</span>
              </button>

              <button
                type="button"
                onClick={() => onDownloadPdf(factura.id, factura.codigo)}
                className="btn btn--outline h-9 sm:h-10 px-3 sm:px-4 text-xs font-bold flex items-center space-x-1.5 text-[#13235B] border-[#13235B]"
              >
                <FileDown className="w-4 h-4" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="btn bg-[#D5DAE6] hover:bg-[#8D9AC0] text-[#13235B] h-9 sm:h-10 px-4 text-xs font-bold"
              >
                CERRAR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
