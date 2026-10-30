import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Reportes e Indicadores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('rentabilidad')
  @ApiOperation({
    summary: 'Indicadores de rentabilidad y métricas del Dashboard (Ingresos, Costos, Utilidad, Margen)',
  })
  @ApiQuery({ name: 'mes', required: false, description: 'Mes numérico (01 - 12)' })
  @ApiQuery({ name: 'anio', required: false, description: 'Año (ej. 2026)' })
  @ApiQuery({ name: 'tipoVehiculo', required: false, description: 'CAMION_CARGA | FURGONETA_ELECTRICA' })
  async getDashboardRentabilidad(
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
    @Query('tipoVehiculo') tipoVehiculo?: string,
  ) {
    return this.reportesService.getDashboardRentabilidad(mes, anio, tipoVehiculo);
  }

  @Get('operaciones')
  @ApiOperation({ summary: 'Consultas estadísticas operativas del sistema' })
  async getOperaciones() {
    const [participacion, porEstado] = await Promise.all([
      this.reportesService.getParticipacionVehiculos(),
      this.reportesService.getDashboardRentabilidad(),
    ]);
    return {
      participacion,
      serviciosPorEstado: porEstado.serviciosPorEstado,
    };
  }

  // ==========================================
  // Req-07: Rutas directas para las 8 consultas
  // ==========================================

  @Get('consultas/costo-supera-promedio')
  @ApiOperation({ summary: 'Consulta 21: Servicios cuyo costo operativo supera el promedio' })
  async getCostoSuperaPromedio() {
    return this.reportesService.getServiciosCostoSuperaPromedio();
  }

  @Get('consultas/participacion-vehiculos')
  @ApiOperation({ summary: 'Consulta 22: Porcentaje de participación de cada vehículo en servicios completados' })
  async getParticipacionVehiculos() {
    return this.reportesService.getParticipacionVehiculos();
  }

  @Get('consultas/clientes-frecuentes')
  @ApiOperation({ summary: 'Consulta 23: Clientes con al menos tres servicios completados en un período' })
  @ApiQuery({ name: 'fechaInicio', required: false })
  @ApiQuery({ name: 'fechaFin', required: false })
  async getClientesFrecuentes(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.reportesService.getClientesFrecuentes(fechaInicio, fechaFin);
  }

  @Get('consultas/vehiculos-sin-servicios')
  @ApiOperation({ summary: 'Consulta 24: Vehículos sin servicios asignados durante un rango de fechas' })
  @ApiQuery({ name: 'fechaInicio', required: true, example: '2026-10-01' })
  @ApiQuery({ name: 'fechaFin', required: true, example: '2026-10-31' })
  async getVehiculosSinServicios(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.reportesService.getVehiculosSinServiciosEnRango(fechaInicio, fechaFin);
  }

  @Get('consultas/top-cinco-rentables')
  @ApiOperation({ summary: 'Consulta 25: Cinco vehículos con mayor rentabilidad por ingresos, costos y margen' })
  async getTopCincoRentables() {
    return this.reportesService.getTopCincoVehiculosRentables();
  }

  @Get('consultas/facturacion-mensual-tipo')
  @ApiOperation({ summary: 'Consulta 26: Facturación mensual agrupada por tipo de vehículo y mes' })
  async getFacturacionMensualTipo() {
    return this.reportesService.getFacturacionMensualPorTipo();
  }

  @Get('consultas/eficiencia-inferior-promedio')
  @ApiOperation({ summary: 'Consulta 27: Vehículos con eficiencia inferior al promedio de su categoría' })
  async getEficienciaInferiorPromedio() {
    return this.reportesService.getVehiculosEficienciaInferiorPromedio();
  }

  @Get('consultas/clientes-disminucion-facturacion')
  @ApiOperation({ summary: 'Consulta 28: Clientes cuya facturación disminuyó más del 20 % respecto al mes anterior' })
  async getClientesDisminucionFacturacion() {
    return this.reportesService.getClientesFacturacionDisminuida();
  }
}
