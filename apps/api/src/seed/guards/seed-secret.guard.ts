import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class SeedSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const seedSecret = this.configService.get<string>('SEED_SECRET');

    if (!seedSecret) {
      throw new ServiceUnavailableException('Seed endpoint is disabled');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedSecret = request.headers['x-seed-secret'];

    if (!providedSecret || providedSecret !== seedSecret) {
      throw new UnauthorizedException(
        'Invalid or missing X-Seed-Secret header',
      );
    }

    return true;
  }
}
