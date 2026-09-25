import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PublicUser } from '../types/public-user.type';
import { UsersService } from '../users.service';

// No login: every request acts as the single local user.
@Injectable()
export class LocalUserGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user: PublicUser }>();
    request.user = await this.usersService.getLocalUser();
    return true;
  }
}
