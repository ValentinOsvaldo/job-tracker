import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SeedResultDto } from './dto/seed-result.dto';
import { SeedSecretGuard } from './guards/seed-secret.guard';
import { SeedService } from './seed.service';

@ApiTags('seed')
@Controller('seed')
@Public()
@UseGuards(SeedSecretGuard)
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Seed initial users',
    description:
      'Creates the default users if they do not exist. Idempotent — existing users are skipped.',
  })
  @ApiHeader({
    name: 'X-Seed-Secret',
    description: 'Must match the SEED_SECRET environment variable',
    required: true,
  })
  @ApiResponse({ status: 200, type: SeedResultDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing X-Seed-Secret' })
  @ApiResponse({ status: 503, description: 'SEED_SECRET is not configured' })
  seed(): Promise<SeedResultDto> {
    return this.seedService.seed();
  }
}
