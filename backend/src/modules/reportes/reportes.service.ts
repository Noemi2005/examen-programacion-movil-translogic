import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EstadoServicio } from '../../common/enums';

@Injectable()
export class ReportesService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Req-08: Métricas del Dashboard de Rentabilidad
   * Ingresos, costos operativos, utilidad, margen, servicios por estado, distribución por tipo y evolución mensual.
   */
  async getDashboardRentabilidad(mes?: string, anio?: string, tipoVehiculo?: string) {
    let whereClauses: string[] = ["s.estado = 'COMPLETADO'"];
    const params: any[] = [];

    if (mes && anio) {
      params.push(`${anio}-${mes.padStart(2, '0')}`);
      whereClauses.push(`TO_CHAR(s.fecha, 'YYYY-MM') = $${params.length}`);
    } else if (anio) {
      params.push(anio);
      whereClauses.push(`TO_CHAR(s.fecha, 'YYYY') = $${params.length}`);
    }

    if (tipoVehiculo) {
      params.push(tipoVehiculo);
      whereClauses.push(`v.tipo = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 1. KPI Totales
    const kpiSql = `
      SELECT 
        COALESCE(SUM(s."tarifaCalculada"), 0) AS "ingresosTotales",
        COALESCE(SUM(s."costoOperativo"), 0) AS "costosOperativosTotales",
        COUNT(s.id) AS "serviciosCompletados"
      FROM servicios_transporte s
      LEFT JOIN vehiculos v ON s."vehiculoId" = v.id
      ${whereSql}
    `;
    const kpiResult = await this.dataSource.query(kpiSql, params);
    const ingresos = Number(kpiResult[0]?.ingresosTotales || 0);
    const costos = Number(kpiResult[0]?.costosOperativosTotales || 0);
    const utilidad = Math.round((ingresos - costos) * 100) / 100;
    const margen = ingresos > 0 ? Math.round(((utilidad / ingresos) * 100) * 100) / 100 : 0;

    // 2. Servicios agrupados por estado
    const estadoSql = `
      SELECT 
        s.estado,
        COUNT(s.id) AS cantidad
      FROM servicios_transporte s
      GROUP BY s.estado
    `;
    const serviciosPorEstado = await this.dataSource.query(estadoSql);

    // 3. Distribución por tipo de vehículo
    const tipoSql = `
      SELECT 
        v.tipo AS "tipoVehiculo",
        COUNT(s.id) AS "totalServicios",
        COALESCE(SUM(s."tarifaCalculada"), 0) AS "ingresos",
        COALESCE(SUM(s."costoOperativo"), 0) AS "costos"
      FROM servicios_transporte s
      INNER JOIN vehiculos v ON s."vehiculoId" = v.id
      WHERE s.estado = 'COMPLETADO'
      GROUP BY v.tipo
    `;
    const distribucionTipo = await this.dataSource.query(tipoSql);

    // 4. Comparación mensual para gráfico de líneas
    const mensualSql = `
      SELECT 
        TO_CHAR(s.fecha, 'YYYY-MM') AS periodo,
        COALESCE(SUM(s."tarifaCalculada"), 0) AS ingresos,
        COALESCE(SUM(s."costoOperativo"), 0) AS costos,
        COALESCE(SUM(s."tarifaCalculada" - s."costoOperativo"), 0) AS utilidad
      FROM servicios_transporte s
      WHERE s.estado = 'COMPLETADO'
      GROUP BY TO_CHAR(s.fecha, 'YYYY-MM')
      ORDER BY periodo ASC
      LIMIT 12
    `;
    const evolucionMensual = await this.dataSource.query(mensualSql);

    return {
      kpi: {
        ingresos,
        costosOperativos: costos,
        utilidad,
        margenPorcentaje: margen,
        serviciosCompletados: Number(kpiResult[0]?.serviciosCompletados || 0),
      },
      serviciosPorEstado,
      distribucionTipo,
      evolucionMensual,
    };
  }

  // ==========================================
  // Req-07: LAS 8 CONSULTAS AVANZADAS EN BD
  // ==========================================

  /**
   * Consulta 21: Servicios cuyo costo operativo supera el promedio de servicios completados
   */
  async getServiciosCostoSuperaPromedio() {
    const sql = `
      SELECT 
        s.id,
        s.codigo,
        s.origen,
        s.destino,
        s."distanciaKm",
        s."costoOperativo",
        s."tarifaCalculada",
        v.placa,
        v.tipo,
        (SELECT ROUND(AVG(sc."costoOperativo")::numeric, 2) 
         FROM servicios_transporte sc 
         WHERE sc.estado = 'COMPLETADO') AS "promedioGeneral"
      FROM servicios_transporte s
      LEFT JOIN vehiculos v ON s."vehiculoId" = v.id
      WHERE s.estado = 'COMPLETADO' 
        AND s."costoOperativo" > (
          SELECT AVG(sc."costoOperativo") 
          FROM servicios_transporte sc 
          WHERE sc.estado = 'COMPLETADO'
        )
      ORDER BY s."costoOperativo" DESC;
    `;
    return this.dataSource.query(sql);
  }

  /**
   * Consulta 22: Porcentaje de participación de cada vehículo en servicios completados
   */
  async getParticipacionVehiculos() {
    const sql = `
      SELECT 
        v.id AS "vehiculoId",
        v.placa,
        v.marca,
        v.modelo,
        v.tipo,
        COUNT(s.id) AS "serviciosCompletados",
        ROUND((COUNT(s.id)::numeric / NULLIF((SELECT COUNT(*) FROM servicios_transporte WHERE estado = 'COMPLETADO'), 0)) * 100, 2) AS "porcentajeParticipacion"
      FROM vehiculos v
      LEFT JOIN servicios_transporte s ON s."vehiculoId" = v.id AND s.estado = 'COMPLETADO'
      GROUP BY v.id, v.placa, v.marca, v.modelo, v.tipo
      ORDER BY "serviciosCompletados" DESC;
    `;
    return this.dataSource.query(sql);
  }

  /**
   * Consulta 23: Clientes con al menos tres servicios completados en un período
   */
  async getClientesFrecuentes(fechaInicio?: string, fechaFin?: string) {
    const params: any[] = [];
    let fechaFilter = '';

    if (fechaInicio && fechaFin) {
      params.push(fechaInicio, fechaFin);
      fechaFilter = 'AND s.fecha BETWEEN $1 AND $2';
    }

    const sql = `
      SELECT 
        c.id AS "clienteId",
        c.identificacion,
        c.nombre,
        c.correo,
        COUNT(s.id) AS "serviciosCompletados",
        ROUND(SUM(s."tarifaCalculada")::numeric, 2) AS "totalFacturado"
      FROM clientes c
      INNER JOIN servicios_transporte s ON s."clienteId" = c.id
      WHERE s.estado = 'COMPLETADO' ${fechaFilter}
      GROUP BY c.id, c.identificacion, c.nombre, c.correo
      HAVING COUNT(s.id) >= 3
      ORDER BY "serviciosCompletados" DESC;
    `;
    return this.dataSource.query(sql, params);
  }

  /**
   * Consulta 24: Vehículos sin servicios asignados durante un rango de fechas
   */
  async getVehiculosSinServiciosEnRango(fechaInicio: string, fechaFin: string) {
    const sql = `
      SELECT 
        v.id,
        v.placa,
        v.marca,
        v.modelo,
        v.tipo,
        v.estado
      FROM vehiculos v
      WHERE NOT EXISTS (
        SELECT 1 
        FROM servicios_transporte s 
        WHERE s."vehiculoId" = v.id 
          AND s.estado != 'CANCELADO'
          AND s.fecha BETWEEN $1 AND $2
      )
      ORDER BY v.placa ASC;
    `;
    return this.dataSource.query(sql, [fechaInicio, fechaFin]);
  }

  /**
   * Consulta 25: Cinco vehículos con mayor rentabilidad por ingresos, costos y margen
   */
  async getTopCincoVehiculosRentables() {
    const sql = `
      SELECT 
        v.id,
        v.placa,
        v.marca,
        v.modelo,
        v.tipo,
        COALESCE(SUM(s."tarifaCalculada"), 0) AS ingresos,
        COALESCE(SUM(s."costoOperativo"), 0) AS costos,
        ROUND((COALESCE(SUM(s."tarifaCalculada"), 0) - COALESCE(SUM(s."costoOperativo"), 0))::numeric, 2) AS utilidad,
        CASE 
          WHEN SUM(s."tarifaCalculada") > 0 THEN 
            ROUND((((SUM(s."tarifaCalculada") - SUM(s."costoOperativo")) / SUM(s."tarifaCalculada")) * 100)::numeric, 2)
          ELSE 0 
        END AS "margenPorcentaje"
      FROM vehiculos v
      INNER JOIN servicios_transporte s ON s."vehiculoId" = v.id
      WHERE s.estado = 'COMPLETADO'
      GROUP BY v.id, v.placa, v.marca, v.modelo, v.tipo
      ORDER BY utilidad DESC
      LIMIT 5;
    `;
    return this.dataSource.query(sql);
  }

  /**
   * Consulta 26: Facturación mensual agrupada por tipo de vehículo y mes
   */
  async getFacturacionMensualPorTipo() {
    const sql = `
      SELECT 
        TO_CHAR(s.fecha, 'YYYY-MM') AS mes,
        v.tipo AS "tipoVehiculo",
        COUNT(s.id) AS "totalServicios",
        ROUND(SUM(s."tarifaCalculada")::numeric, 2) AS "facturacionTotal",
        ROUND(AVG(s."tarifaCalculada")::numeric, 2) AS "tarifaPromedio"
      FROM servicios_transporte s
      INNER JOIN vehiculos v ON s."vehiculoId" = v.id
      WHERE s.estado = 'COMPLETADO'
      GROUP BY TO_CHAR(s.fecha, 'YYYY-MM'), v.tipo
      ORDER BY mes DESC, v.tipo ASC;
    `;
    return this.dataSource.query(sql);
  }

  /**
   * Consulta 27: Vehículos con eficiencia inferior al promedio de su categoría
   */
  async getVehiculosEficienciaInferiorPromedio() {
    // Para camiones: consumoLitros100Km > promedio de camiones
    // Para furgonetas: consumoKWh100Km > promedio de furgonetas
    const sql = `
      SELECT 
        v.id,
        v.placa,
        v.marca,
        v.modelo,
        v.tipo,
        CASE 
          WHEN v.tipo = 'CAMION_CARGA' THEN cc."consumoLitros100Km"
          ELSE fe."consumoKWh100Km"
        END AS "consumoRegistrado",
        CASE 
          WHEN v.tipo = 'CAMION_CARGA' THEN (SELECT ROUND(AVG("consumoLitros100Km")::numeric, 2) FROM camiones_carga)
          ELSE (SELECT ROUND(AVG("consumoKWh100Km")::numeric, 2) FROM furgonetas_electricas)
        END AS "consumoPromedioCategoria",
        'Mayor consumo que el promedio de categoría (Menor eficiencia)' AS diagnostico
      FROM vehiculos v
      LEFT JOIN camiones_carga cc ON cc."vehiculoId" = v.id
      LEFT JOIN furgonetas_electricas fe ON fe."vehiculoId" = v.id
      WHERE 
        (v.tipo = 'CAMION_CARGA' AND cc."consumoLitros100Km" > (SELECT AVG("consumoLitros100Km") FROM camiones_carga))
        OR
        (v.tipo = 'FURGONETA_ELECTRICA' AND fe."consumoKWh100Km" > (SELECT AVG("consumoKWh100Km") FROM furgonetas_electricas))
      ORDER BY v.tipo, "consumoRegistrado" DESC;
    `;
    return this.dataSource.query(sql);
  }

  /**
   * Consulta 28: Clientes cuya facturación disminuyó más del 20 % respecto al mes anterior
   */
  async getClientesFacturacionDisminuida() {
    const sql = `
      WITH FacturacionMensual AS (
        SELECT 
          c.id AS "clienteId",
          c.nombre AS "clienteNombre",
          TO_CHAR(s.fecha, 'YYYY-MM') AS mes,
          SUM(s."tarifaCalculada") AS facturacion
        FROM clientes c
        INNER JOIN servicios_transporte s ON s."clienteId" = c.id
        WHERE s.estado = 'COMPLETADO'
        GROUP BY c.id, c.nombre, TO_CHAR(s.fecha, 'YYYY-MM')
      ),
      ComparacionConLag AS (
        SELECT 
          "clienteId",
          "clienteNombre",
          mes,
          facturacion AS "facturacionActual",
          LAG(facturacion) OVER (PARTITION BY "clienteId" ORDER BY mes) AS "facturacionMesAnterior"
        FROM FacturacionMensual
      )
      SELECT 
        "clienteId",
        "clienteNombre",
        mes,
        ROUND("facturacionActual"::numeric, 2) AS "facturacionActual",
        ROUND("facturacionMesAnterior"::numeric, 2) AS "facturacionMesAnterior",
        ROUND((("facturacionMesAnterior" - "facturacionActual") / "facturacionMesAnterior" * 100)::numeric, 2) AS "porcentajeDisminucion"
      FROM ComparacionConLag
      WHERE "facturacionMesAnterior" > 0 
        AND (("facturacionMesAnterior" - "facturacionActual") / "facturacionMesAnterior") > 0.20
      ORDER BY "porcentajeDisminucion" DESC;
    `;
    return this.dataSource.query(sql);
  }
}
