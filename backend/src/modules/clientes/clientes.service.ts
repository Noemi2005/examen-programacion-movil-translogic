import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../../database/entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
  ) {}

  async findAll(): Promise<Cliente[]> {
    return this.clienteRepo.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepo.findOne({ where: { id } });
    if (!cliente) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
    }
    return cliente;
  }

  async create(createDto: CreateClienteDto): Promise<Cliente> {
    const existeId = await this.clienteRepo.findOne({ where: { identificacion: createDto.identificacion } });
    if (existeId) {
      throw new ConflictException(`Ya existe un cliente con la identificación ${createDto.identificacion}`);
    }
    const existeCorreo = await this.clienteRepo.findOne({ where: { correo: createDto.correo } });
    if (existeCorreo) {
      throw new ConflictException(`Ya existe un cliente con el correo ${createDto.correo}`);
    }

    const cliente = this.clienteRepo.create(createDto);
    return this.clienteRepo.save(cliente);
  }
}
