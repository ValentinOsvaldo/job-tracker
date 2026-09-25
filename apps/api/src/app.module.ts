import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import {
  createPostgresOptions,
  getDatabaseUrlFromConfigService,
} from './config/database.config';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { LocalUserGuard } from './users/guards/local-user.guard';
import { JobsModule } from './jobs/jobs.module';
import { AiModule } from './ai/ai.module';
import { ProfilesModule } from './profiles/profiles.module';
import { JobAnalysesModule } from './job-analyses/job-analyses.module';
import { ResumeModule } from './resume/resume.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
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
    JobsModule,
    ProfilesModule,
    JobAnalysesModule,
    AiModule,
    ResumeModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: LocalUserGuard,
    },
  ],
})
export class AppModule {}
