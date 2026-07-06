import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export interface DatabaseEnvConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export function getDatabaseEnvConfigFromProcessEnv(
  env: NodeJS.ProcessEnv,
): DatabaseEnvConfig {
  const required = (key: string): string => {
    const value = env[key];

    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }

    return value;
  };

  return {
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: required('DB_USERNAME'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
  };
}

export function getDatabaseEnvConfigFromConfigService(
  configService: ConfigService,
): DatabaseEnvConfig {
  return {
    host: configService.get<string>('DB_HOST') ?? 'localhost',
    port: Number(configService.get<string>('DB_PORT') ?? 5432),
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_NAME'),
  };
}

export function createPostgresOptions(
  config: DatabaseEnvConfig,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
  };
}
