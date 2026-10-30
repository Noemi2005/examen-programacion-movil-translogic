import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';
import { Factura } from '../../database/entities/factura.entity';

@Injectable()
export class PdfGeneratorService {
  public async generarFacturaPdf(factura: Factura): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new (PDFDocument as any)({
        margin: 40,
        size: 'A4',
        info: {
          Title: `Factura-${factura.codigo}`,
          Author: 'TRANSLOGIC S.A.',
          Subject: 'Factura Electrónica Simulada',
        },
      });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      // Localización segura del logo
      const candidatePaths = [
        path.join(__dirname, '../../assets/logo.png'),
        path.join(__dirname, '../assets/logo.png'),
        path.join(__dirname, 'assets/logo.png'),
        path.join(process.cwd(), 'assets/logo.png'),
        path.join(process.cwd(), 'backend/assets/logo.png'),
        path.join(process.cwd(), 'dist/assets/logo.png'),
        path.join(process.cwd(), '../frontend/public/logo.png'),
        path.join(process.cwd(), 'frontend/public/logo.png'),
      ];
      const logoPath = candidatePaths.find((p) => fs.existsSync(p));

      // 1. ENCABEZADO: Logo + Datos de la Compañía (y = 40 a 105)
      if (logoPath) {
        try {
          doc.image(logoPath, 40, 40, { width: 140 });
        } catch {
          doc.fontSize(16).font('Helvetica-Bold').fillColor('#13235B').text('TRANSLOGIC S.A.', 40, 42);
        }
      } else {
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#13235B').text('TRANSLOGIC S.A.', 40, 42);
      }

      // Datos corporativos alineados a la derecha
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#13235B').text('TRANSLOGIC S.A.', 200, 40, { align: 'right', width: 355 });
      doc.fontSize(8.5).font('Helvetica').fillColor('#5B6480');
      doc.text('Operador Logístico de Carga Pesada y Envíos Especializados', 200, 58, { align: 'right', width: 355 });
      doc.text('RUC: 1792345678001 | Matriz: Quito - Ecuador', 200, 70, { align: 'right', width: 355 });
      doc.text('PBX: (02) 2999-000 | facturacion@translogic.ec | www.translogic.ec', 200, 82, { align: 'right', width: 355 });
      doc.text('Resolución SRI N°: NAC-DGERCGC12-0001 | Contribuyente Especial', 200, 94, { align: 'right', width: 355 });

      // 2. BANNER DE ADVERTENCIA ACADÉMICA SRI OBLIGATORIA (y = 114)
      const bannerY = 114;
      doc.rect(40, bannerY, 515, 24).fillAndStroke('#FEF2F2', '#EF4444');
      doc
        .fillColor('#B91C1C')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('COMPROBANTE SIMULADO - SIN VALIDEZ TRIBUTARIA ANTE EL SRI', 40, bannerY + 7, {
          align: 'center',
          width: 515,
        });

      // 3. BLOQUES DE METADATOS: COMPROBANTE Y CLIENTE (y = 148, altura = 106)
      const infoY = 148;
      const boxHeight = 106;

      // Caja Izquierda: Datos del Comprobante
      doc.rect(40, infoY, 250, boxHeight).stroke('#D5DAE6');
      doc.rect(40, infoY, 250, 20).fill('#13235B');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF').text('DATOS DE LA FACTURA', 48, infoY + 5);

      doc.fillColor('#13235B').font('Helvetica-Bold').fontSize(8.5);
      doc.text('N° FACTURA:', 48, infoY + 26);
      doc.font('Helvetica').text(factura.codigo, 135, infoY + 26);

      doc.font('Helvetica-Bold').text('FECHA EMISIÓN:', 48, infoY + 39);
      doc.font('Helvetica').text(new Date(factura.fecha).toLocaleDateString('es-EC'), 135, infoY + 39);

      doc.font('Helvetica-Bold').text('ESTADO SRI:', 48, infoY + 52);
      doc.font('Helvetica-Bold').fillColor('#1E9E5A').text('AUTORIZADO', 135, infoY + 52);

      // Clave de Acceso claramente separada sin amontonamiento
      doc.fillColor('#5B6480').font('Helvetica-Bold').fontSize(7);
      doc.text('CLAVE DE ACCESO:', 48, infoY + 66);
      
      doc.fillColor('#13235B').font('Courier').fontSize(6.5);
      doc.text('3010202601179234567800120010010000000051234567819', 48, infoY + 76);

      // Ambiente y Emisión
      doc.fillColor('#5B6480').font('Helvetica').fontSize(7);
      doc.text('AMBIENTE: PRODUCCIÓN   |   EMISIÓN: NORMAL', 48, infoY + 89);

      // Caja Derecha: Datos del Cliente Receptor
      doc.rect(305, infoY, 250, boxHeight).stroke('#D5DAE6');
      doc.rect(305, infoY, 250, 20).fill('#13235B');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF').text('DATOS DEL CLIENTE / RECEPTOR', 313, infoY + 5);

      doc.fillColor('#13235B').font('Helvetica-Bold').fontSize(8.5);
      doc.text('Razón Social:', 313, infoY + 26);
      doc.font('Helvetica').text(factura.cliente?.nombre || 'N/A', 380, infoY + 26, { width: 170 });

      doc.font('Helvetica-Bold').text('RUC / C.I.:', 313, infoY + 41);
      doc.font('Helvetica').text(factura.cliente?.identificacion || 'N/A', 380, infoY + 41);

      doc.font('Helvetica-Bold').text('Correo:', 313, infoY + 56);
      doc.font('Helvetica').text(factura.cliente?.correo || 'N/A', 380, infoY + 56, { width: 170 });

      doc.font('Helvetica-Bold').text('Teléfono:', 313, infoY + 71);
      doc.font('Helvetica').text(factura.cliente?.telefono || 'N/A', 380, infoY + 71);

      doc.font('Helvetica-Bold').text('Dirección:', 313, infoY + 86);
      doc.font('Helvetica').text('Quito, Pichincha, Ecuador', 380, infoY + 86, { width: 170 });

      // 4. TABLA DE SERVICIOS / DETALLE (y = infoY + boxHeight + 12 = 266)
      const tableTop = infoY + boxHeight + 12;
      doc.rect(40, tableTop, 515, 22).fill('#13235B');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
      doc.text('SERVICIO', 46, tableTop + 6, { width: 75 });
      doc.text('RUTA (ORIGEN -> DESTINO)', 125, tableTop + 6, { width: 175 });
      doc.text('UNIDAD', 305, tableTop + 6, { width: 65 });
      doc.text('TARIFA BASE', 375, tableTop + 6, { width: 60, align: 'right' });
      doc.text('RECARGOS', 440, tableTop + 6, { width: 50, align: 'right' });
      doc.text('SUBTOTAL', 495, tableTop + 6, { width: 55, align: 'right' });

      let currentY = tableTop + 22;

      // Altura generosa de 38px por fila para que las rutas largas y textos multilínea nunca se corten
      const itemRowHeight = 38;

      if (factura.detalles && factura.detalles.length > 0) {
        let isEven = false;
        for (const d of factura.detalles) {
          const s = d.servicio;
          const subtotalItem = Number(d.tarifa) + Number(d.recargos);

          if (isEven) {
            doc.rect(40, currentY, 515, itemRowHeight).fill('#F3F5FA');
          }

          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#13235B')
            .text(s?.codigo || 'N/A', 46, currentY + 8, { width: 75 })
            .text(`${s?.origen || ''} -> ${s?.destino || ''}`, 125, currentY + 8, {
              width: 175,
              lineGap: 2.5,
            })
            .text(s?.vehiculo?.placa || 'N/A', 305, currentY + 8, { width: 65 })
            .text(`$${Number(d.tarifa).toFixed(2)}`, 375, currentY + 8, { width: 60, align: 'right' })
            .text(`$${Number(d.recargos).toFixed(2)}`, 440, currentY + 8, { width: 50, align: 'right' })
            .font('Helvetica-Bold')
            .text(`$${subtotalItem.toFixed(2)}`, 495, currentY + 8, { width: 55, align: 'right' });

          currentY += itemRowHeight;
          isEven = !isEven;
        }
      }

      doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#D5DAE6');
      currentY += 15;

      // 5. CAJA DE INFORMACIÓN ADICIONAL + CAJA DE TOTALES
      const summaryLeft = 315;
      const summaryWidth = 240;
      const blockHeight = 106;

      // Caja Izquierda: Info Adicional y Forma de Pago
      doc.rect(40, currentY, 260, blockHeight).stroke('#D5DAE6');
      doc.rect(40, currentY, 260, 20).fill('#F3F5FA');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#13235B').text('INFORMACIÓN ADICIONAL Y CONDICIONES', 48, currentY + 5);

      doc.fontSize(7.5).font('Helvetica').fillColor('#5B6480');
      doc.text('Forma de Pago: Otros con utilización del sistema financiero', 48, currentY + 28);
      doc.text('Condición: Contado - Pago a la emisión', 48, currentY + 42);
      doc.text('Moneda: DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA (USD)', 48, currentY + 56);
      doc.text('Observación: Flete de carga liquidado bajo orden operativa validada.', 48, currentY + 70, { width: 245 });

      // Caja Derecha: Desglose de Totales Financieros
      doc.rect(summaryLeft, currentY, summaryWidth, blockHeight).stroke('#D5DAE6');

      let sumY = currentY + 8;
      doc.fontSize(8.5).font('Helvetica').fillColor('#5B6480');
      doc.text('Subtotal Base:', summaryLeft + 12, sumY);
      doc.font('Helvetica-Bold').fillColor('#13235B').text(`$${Number(factura.subtotal).toFixed(2)}`, summaryLeft + 130, sumY, { align: 'right', width: 95 });

      sumY += 18;
      doc.font('Helvetica').fillColor('#5B6480');
      doc.text('Recargos (>300km / Domingo):', summaryLeft + 12, sumY);
      doc.font('Helvetica-Bold').fillColor('#F5A623').text(`+$${Number(factura.recargos).toFixed(2)}`, summaryLeft + 130, sumY, { align: 'right', width: 95 });

      sumY += 18;
      doc.font('Helvetica').fillColor('#5B6480');
      doc.text('Descuento por Frecuencia:', summaryLeft + 12, sumY);
      doc.font('Helvetica-Bold').fillColor('#1E9E5A').text(`-$${Number(factura.descuento).toFixed(2)}`, summaryLeft + 130, sumY, { align: 'right', width: 95 });

      sumY += 18;
      doc.font('Helvetica').fillColor('#5B6480');
      doc.text('Impuesto al Valor Agregado (IVA 15%):', summaryLeft + 12, sumY);
      doc.font('Helvetica-Bold').fillColor('#13235B').text(`$${Number(factura.impuesto).toFixed(2)}`, summaryLeft + 130, sumY, { align: 'right', width: 95 });

      sumY += 20;
      // Barra de Total a Pagar
      doc.rect(summaryLeft, sumY, summaryWidth, 24).fill('#13235B');
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#FFFFFF');
      doc.text('TOTAL A PAGAR:', summaryLeft + 12, sumY + 7);
      doc.text(`$${Number(factura.total).toFixed(2)} USD`, summaryLeft + 120, sumY + 7, { align: 'right', width: 105 });

      // 6. PIE DE PÁGINA INSTITUCIONAL
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#8D9AC0')
        .text('Documento emitido electrónicamente por TRANSLOGIC S.A. | Válido únicamente con fines demostrativos y académicos', 40, 785, {
          align: 'center',
          width: 515,
        });

      doc.end();
    });
  }
}
