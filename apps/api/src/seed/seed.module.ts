import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { SeedSecretGuard } from './guards/seed-secret.guard';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [SeedController],
  providers: [SeedService, SeedSecretGuard],
})
export class SeedModule {}
