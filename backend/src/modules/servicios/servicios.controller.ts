import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { SimularTarifaDto } from './dto/simular-tarifa.dto';
import { AsignarVehiculoDto } from './dto/asignar-vehiculo.dto';
import { UpdateServicioEstadoDto } from './dto/update-servicio-estado.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EstadoServicio } from '../../common/enums';
import { Usuario } from '../../database/entities/usuario.entity';

@ApiTags('Servicios de Transporte')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Post('simular-tarifa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simular tarifa y costos antes de registrar o asignar' })
  async simularTarifa(@Body() dto: SimularTarifaDto) {
    return this.serviciosService.simularTarifa(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo servicio de transporte con recálculo en servidor' })
  @ApiResponse({ status: 201, description: 'Servicio registrado correctamente' })
  async create(@Body() createDto: CreateServicioDto, @CurrentUser() user: Usuario) {
    return this.serviciosService.create(createDto, user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Consultar historial paginado de servicios con filtros avanzados' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoServicio })
  @ApiQuery({ name: 'clienteId', required: false })
  @ApiQuery({ name: 'vehiculoId', required: false })
  @ApiQuery({ name: 'fecha', required: false, description: 'YYYY-MM-DD' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('estado') estado?: EstadoServicio,
    @Query('clienteId') clienteId?: string,
    @Query('vehiculoId') vehiculoId?: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.serviciosService.findAll(page || 1, limit || 10, estado, clienteId, vehiculoId, fecha);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle completo de un servicio de transporte' })
  async findOne(@Param('id') id: string) {
    return this.serviciosService.findOne(id);
  }

  @Patch(':id/asignacion')
  @ApiOperation({
    summary: 'Asignar vehículo con control de concurrencia y validación de horarios no solapados',
  })
  async asignarVehiculo(
    @Param('id') id: string,
    @Body() dto: AsignarVehiculoDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.serviciosService.asignarVehiculo(id, dto, user?.id);
  }

  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Actualizar estado del servicio (Programado -> En ejecución -> Completado / Cancelado)',
  })
  async actualizarEstado(
    @Param('id') id: string,
    @Body() dto: UpdateServicioEstadoDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.serviciosService.actualizarEstado(id, dto.nuevoEstado, user?.id);
  }
}
