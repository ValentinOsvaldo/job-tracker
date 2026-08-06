import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import {
  createPostgresOptions,
  getDatabaseUrlFromConfigService,
} from './config/database.config';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { AiModule } from './ai/ai.module';
import { ProfilesModule } from './profiles/profiles.module';
import { JobAnalysesModule } from './job-analyses/job-analyses.module';
import { SeedModule } from './seed/seed.module';
import { ResumeModule } from './resume/resume.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...createPostgresOptions(
          getDatabaseUrlFromConfigService(configService),
        ),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') !== 'production',
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        migrationsRun: configService.get('NODE_ENV') === 'production',
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    JobsModule,
    ProfilesModule,
    JobAnalysesModule,
    AiModule,
    SeedModule,
    ResumeModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
