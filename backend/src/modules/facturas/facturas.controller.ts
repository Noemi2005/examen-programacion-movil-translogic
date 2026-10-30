import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FacturasService } from './facturas.service';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums';

@ApiTags('Facturación')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las facturas emitidas' })
  async findAll() {
    return this.facturasService.findAll();
  }

  @Post()
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Generar factura atómica para servicios completados con descuentos y recargos (Solo Administrador)',
  })
  @ApiResponse({ status: 201, description: 'Factura generada exitosamente' })
  async generarFactura(@Body() dto: CreateFacturaDto) {
    return this.facturasService.generarFactura(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar detalle de una factura por ID' })
  async findOne(@Param('id') id: string) {
    return this.facturasService.findOne(id);
  }

  @Get(':id/pdf')
  @ApiOperation({
    summary: 'Descargar comprobante en PDF simulado (sin validez tributaria ante el SRI)',
  })
  async descargarPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.facturasService.generarPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=comprobante-simulado-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
