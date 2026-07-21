import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

function isLocalHost(databaseUrl: string): boolean {
  return /localhost|127\.0\.0\.1/.test(databaseUrl);
}

export function getDatabaseUrlFromProcessEnv(env: NodeJS.ProcessEnv): string {
  const value = env.DATABASE_URL;
  if (!value) {
    throw new Error('Missing environment variable: DATABASE_URL');
  }
  return value;
}

export function getDatabaseUrlFromConfigService(
  configService: ConfigService,
): string {
  return configService.getOrThrow<string>('DATABASE_URL');
}

export function createPostgresOptions(databaseUrl: string): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    ssl: isLocalHost(databaseUrl) ? false : { rejectUnauthorized: false }, // Neon uses its own certs
  };
}
