import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import {
  createPostgresOptions,
  getDatabaseEnvConfigFromConfigService,
} from './config/database.config';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { GroqModule } from './groq/groq.module';
import { ProfilesModule } from './profiles/profiles.module';
import { JobAnalysesModule } from './job-analyses/job-analyses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...createPostgresOptions(
          getDatabaseEnvConfigFromConfigService(configService),
        ),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    JobsModule,
    ProfilesModule,
    JobAnalysesModule,
    GroqModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
