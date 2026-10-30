import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { RolUsuario } from '../../../common/enums';
import { Usuario } from '../../../database/entities/usuario.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolUsuario[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user: Usuario = request.user;

    if (!user || !user.rol) {
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }

    const hasRole = requiredRoles.includes(user.rol);
    if (!hasRole) {
      throw new ForbiddenException(`Requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
