import React from 'react';
import { X, Printer, Download, ArrowRight, ShieldCheck } from 'lucide-react';
import { Factura } from '../types';
import { api } from '../api/client';

interface TicketPosModalProps {
  factura: Factura | null;
  onClose: () => void;
}

export const TicketPosModal: React.FC<TicketPosModalProps> = ({ factura, onClose }) => {
  if (!factura) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await api.descargarFacturaPdf(factura.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura-Simulada-${factura.codigo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Error al descargar PDF');
    }
  };

  // Obtener servicio representativo o detalles
  const primerDetalle = factura.detalles?.[0];
  const primerServicio = primerDetalle?.servicio;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0D1A4A]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white"
      onClick={onClose}
    >
      {/* Contenedor del Ticket POS */}
      <div
        className="ticket-modal-card bg-white border-2 border-[#13235B] w-full max-w-md shadow-2xl p-6 space-y-4 print:shadow-none print:border-none print:w-[80mm] print:p-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Cabecera Institucional POS */}
        <div className="flex items-start justify-between border-b-2 border-dashed border-[#D5DAE6] pb-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-[#F5A623] inline-block flex-shrink-0" />
            <div>
              <h3 className="font-display font-black text-lg tracking-wider text-[#13235B] leading-none">
                TRANSLOGIC S.A.
              </h3>
              <p className="font-mono text-[10px] text-[#5B6480] mt-0.5">
                R.U.C. 1790011223001 &bull; Matriz: Quito, Ecuador
              </p>
              <span className="text-[9px] font-mono text-[#8D9AC0] block">
                COMPROBANTE DE VENTA ELECTRÓNICO SIMULADO
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon btn-icon--secondary print:hidden"
            title="Cerrar"
          >
            <X className="w-4 h-4 text-[#13235B]" />
          </button>
        </div>

        {/* 2. Barra de Código con Borde Troquelado */}
        <div className="bg-[#FAFBFD] border border-dashed border-[#13235B] p-2.5 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-[#5B6480] text-[10px] block">NO. AUTORIZACIÓN:</span>
            <strong className="text-[#13235B] font-bold tracking-wider">{factura.codigo}</strong>
          </div>
          <span className="px-2 py-0.5 bg-[#1E9E5A] text-white text-[10px] font-bold tracking-wider uppercase">
            EMITIDA / PAGADA
          </span>
        </div>

        {/* 3. Bloque de Trayecto Destacado (si existe servicio) */}
        {primerServicio && (
          <div className="bg-[#F3F5FA] border border-[#D5DAE6] p-3 text-xs font-mono">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] text-[#5B6480] uppercase block">ORIGEN</span>
                <strong className="text-[#13235B] text-xs font-bold leading-tight block">
                  {primerServicio.origen}
                </strong>
              </div>
              <ArrowRight className="w-4 h-4 text-[#F5A623] flex-shrink-0 mx-2" />
              <div className="text-right">
                <span className="text-[9px] text-[#5B6480] uppercase block">DESTINO</span>
                <strong className="text-[#13235B] text-xs font-bold leading-tight block">
                  {primerServicio.destino}
                </strong>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#D5DAE6] flex justify-between text-[10px] text-[#5B6480]">
              <span>Distancia: <strong>{primerServicio.distanciaKm} km</strong></span>
              <span>Carga: <strong>{primerServicio.pesoCargaKg} kg</strong></span>
            </div>
          </div>
        )}

        {/* 4. Cuadrícula de Datos del Cliente */}
        <div className="border border-[#D5DAE6] p-3 space-y-1.5 text-xs font-mono bg-white">
          <div className="flex justify-between">
            <span className="text-[#5B6480]">Cliente:</span>
            <strong className="text-[#13235B] text-right truncate max-w-[220px]">
              {factura.cliente?.nombre || 'Consumidor Final'}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5B6480]">RUC / C.I.:</span>
            <strong className="text-[#13235B]">{factura.cliente?.identificacion || '9999999999999'}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5B6480]">Fecha Emisión:</span>
            <strong className="text-[#13235B]">
              {new Date(factura.fecha).toLocaleDateString()} {new Date(factura.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5B6480]">Forma de Pago:</span>
            <strong className="text-[#13235B]">TRANSFERENCIA / CRÉDITO</strong>
          </div>
        </div>

        {/* 5. Desglose Tarifario / Liquidación Contable */}
        <div className="border-t-2 border-dashed border-[#D5DAE6] pt-3 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-[#5B6480]">
            <span>SUBTOTAL BASE:</span>
            <span className="font-bold text-[#13235B]">${Number(factura.subtotal).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-[#5B6480]">
            <span>RECARGOS (+6% / +12%):</span>
            <span className="font-bold text-[#F5A623]">+${Number(factura.recargos).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-[#5B6480]">
            <span>DESCUENTO VOLUMEN:</span>
            <span className="font-bold text-[#1E9E5A]">
              {Number(factura.descuento) > 0 ? `-$${Number(factura.descuento).toFixed(2)}` : '$0.00'}
            </span>
          </div>

          <div className="flex justify-between text-[#5B6480]">
            <span>I.V.A. (15%):</span>
            <span className="font-bold text-[#13235B]">${Number(factura.impuesto).toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t-2 border-[#13235B] flex justify-between items-center text-sm font-black">
            <span className="font-display tracking-wider text-[#13235B]">TOTAL A PAGAR:</span>
            <span className="font-display text-lg text-[#13235B] bg-[#F5A623] px-2 py-0.5">
              ${Number(factura.total).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* 6. Código de Barras Generado con Puro CSS (Sin librerías externas) */}
        <div className="text-center pt-2 border-t border-dashed border-[#D5DAE6] space-y-1">
          <div
            className="h-10 max-w-[280px] mx-auto"
            style={{
              background:
                'repeating-linear-gradient(90deg, #000000, #000000 2px, #ffffff 2px, #ffffff 5px, #000000 5px, #000000 8px, #ffffff 8px, #ffffff 11px)',
            }}
          />
          <span className="font-mono text-[10px] tracking-widest text-[#5B6480] uppercase block">
            * {factura.codigo} &bull; COMPROBANTE OFICIAL SRI *
          </span>
          <div className="flex items-center justify-center space-x-1 text-[9px] text-[#8D9AC0] font-mono">
            <ShieldCheck className="w-3 h-3 text-[#1E9E5A]" />
            <span>FIRMA ELECTRÓNICA VÁLIDA CONFORME A LEY DE COMERCIO ELECTRÓNICO</span>
          </div>
        </div>

        {/* 7. Botones de Acción */}
        <div className="ticket-footer pt-3 border-t border-[#D5DAE6] flex flex-col sm:flex-row items-center justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="btn btn--outline h-9 px-4 text-xs font-bold w-full sm:w-auto"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="btn btn--outline h-9 px-3 text-xs font-mono font-bold flex items-center space-x-1.5 w-full sm:w-auto text-[#13235B]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF Oficial</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn bg-[#13235B] hover:bg-[#0D1A4A] text-white h-9 px-4 text-xs font-bold flex items-center space-x-1.5 w-full sm:w-auto"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>🖨️ Imprimir Ticket POS</span>
          </button>
        </div>
      </div>
    </div>
  );
};

