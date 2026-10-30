import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Factura } from '../../database/entities/factura.entity';

@Injectable()
export class PdfGeneratorService {
  public async generarFacturaPdf(factura: Factura): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new (PDFDocument as any)({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      // Encabezado
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('TRANSLOGIC S.A.', { align: 'center' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#4b5563')
        .text('Sistema Inteligente de Gestión de Flotas y Transporte', { align: 'center' })
        .text('RUC: 1792345678001 | Quito - Ecuador | PBX: (02) 2999-000', { align: 'center' });

      doc.moveDown(0.5);

      // Marca de advertencia académica obligatoria
      doc
        .rect(40, doc.y, 515, 24)
        .fill('#fef2f2')
        .stroke('#ef4444');

      doc
        .fillColor('#b91c1c')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('COMPROBANTE SIMULADO - SIN VALIDEZ TRIBUTARIA ANTE EL SRI', 45, doc.y - 18, {
          align: 'center',
          width: 505,
        });

      doc.moveDown(1.5);

      // Información de Factura y Cliente
      const posY = doc.y;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#111827')
        .text(`FACTURA N°: ${factura.codigo}`, 40, posY)
        .font('Helvetica')
        .text(`Fecha de Emisión: ${new Date(factura.fecha).toLocaleDateString()}`, 40, posY + 15)
        .text(`Estado: PAGADO / EMITIDO`, 40, posY + 30);

      doc
        .font('Helvetica-Bold')
        .text('DATOS DEL CLIENTE:', 300, posY)
        .font('Helvetica')
        .text(`Razón Social: ${factura.cliente?.nombre || 'N/A'}`, 300, posY + 15)
        .text(`RUC / Cédula: ${factura.cliente?.identificacion || 'N/A'}`, 300, posY + 30)
        .text(`Correo: ${factura.cliente?.correo || 'N/A'}`, 300, posY + 45)
        .text(`Teléfono: ${factura.cliente?.telefono || 'N/A'}`, 300, posY + 60);

      doc.moveDown(4.5);

      // Tabla de ítems / Detalle
      const tableTop = doc.y;
      doc
        .rect(40, tableTop, 515, 20)
        .fill('#f3f4f6');

      doc
        .fillColor('#1f2937')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('Servicio', 45, tableTop + 5, { width: 80 })
        .text('Origen / Destino', 130, tableTop + 5, { width: 170 })
        .text('Vehículo', 305, tableTop + 5, { width: 70 })
        .text('Tarifa Base', 380, tableTop + 5, { width: 65, align: 'right' })
        .text('Recargos', 450, tableTop + 5, { width: 50, align: 'right' })
        .text('Subtotal', 505, tableTop + 5, { width: 45, align: 'right' });

      let currentY = tableTop + 24;

      if (factura.detalles && factura.detalles.length > 0) {
        for (const d of factura.detalles) {
          const s = d.servicio;
          const subtotalItem = Number(d.tarifa) + Number(d.recargos);

          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#374151')
            .text(s?.codigo || 'N/A', 45, currentY, { width: 80 })
            .text(`${s?.origen || ''} -> ${s?.destino || ''}`, 130, currentY, { width: 170 })
            .text(s?.vehiculo?.placa || 'N/A', 305, currentY, { width: 70 })
            .text(`$${Number(d.tarifa).toFixed(2)}`, 380, currentY, { width: 65, align: 'right' })
            .text(`$${Number(d.recargos).toFixed(2)}`, 450, currentY, { width: 50, align: 'right' })
            .text(`$${subtotalItem.toFixed(2)}`, 505, currentY, { width: 45, align: 'right' });

          currentY += 18;
        }
      }

      doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#e5e7eb');
      currentY += 15;

      // Resumen de Totales
      const summaryLeft = 340;
      doc
        .fontSize(9)
        .font('Helvetica')
        .text('Subtotal Base:', summaryLeft, currentY)
        .text(`$${Number(factura.subtotal).toFixed(2)}`, 480, currentY, { align: 'right', width: 70 });
      currentY += 14;

      doc
        .text('Recargos (>300km / Domingo):', summaryLeft, currentY)
        .text(`$${Number(factura.recargos).toFixed(2)}`, 480, currentY, { align: 'right', width: 70 });
      currentY += 14;

      doc
        .text('Descuento por Frecuencia:', summaryLeft, currentY)
        .text(`-$${Number(factura.descuento).toFixed(2)}`, 480, currentY, { align: 'right', width: 70 });
      currentY += 14;

      doc
        .text('Impuesto (IVA 15%):', summaryLeft, currentY)
        .text(`$${Number(factura.impuesto).toFixed(2)}`, 480, currentY, { align: 'right', width: 70 });
      currentY += 16;

      doc
        .rect(summaryLeft - 5, currentY - 3, 220, 22)
        .fill('#e0e7ff');

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('TOTAL A PAGAR:', summaryLeft, currentY + 3)
        .text(`$${Number(factura.total).toFixed(2)} USD`, 470, currentY + 3, { align: 'right', width: 80 });

      // Pie de página
      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .fillColor('#9ca3af')
        .text('Documento generado automáticamente por TRANSLOGIC S.A. Plataforma Móvil', 40, 780, {
          align: 'center',
          width: 515,
        });

      doc.end();
    });
  }
}
