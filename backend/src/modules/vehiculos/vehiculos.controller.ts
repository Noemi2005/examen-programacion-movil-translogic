import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario, TipoVehiculo, EstadoVehiculo } from '../../common/enums';

@ApiTags('Vehículos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar vehículos con filtros de búsqueda por placa, marca, tipo y estado' })
  @ApiQuery({ name: 'search', required: false, description: 'Búsqueda por texto en placa, marca o modelo' })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoVehiculo })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoVehiculo })
  async findAll(
    @Query('search') search?: string,
    @Query('tipo') tipo?: TipoVehiculo,
    @Query('estado') estado?: EstadoVehiculo,
  ) {
    return this.vehiculosService.findAll(search, tipo, estado);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vehículo por su ID o placa' })
  async findOne(@Param('id') id: string) {
    // Si contiene guión o formato placa típico, intentar por placa si no es UUID
    if (id.includes('-') && id.length <= 10) {
      return this.vehiculosService.findByPlaca(id.toUpperCase());
    }
    return this.vehiculosService.findOne(id);
  }

  @Post()
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Registrar un nuevo vehículo (Solo Administrador)' })
  @ApiResponse({ status: 201, description: 'Vehículo registrado correctamente' })
  async create(@Body() createDto: CreateVehiculoDto) {
    return this.vehiculosService.create(createDto);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Modificar datos de un vehículo (Solo Administrador)' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateVehiculoDto) {
    return this.vehiculosService.update(id, updateDto);
  }

  @Get(':id/eficiencia')
  @ApiOperation({ summary: 'Evaluar eficiencia operativa y energética del vehículo' })
  async getEficiencia(@Param('id') id: string) {
    return this.vehiculosService.getEficiencia(id);
  }
}
