import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import {
  createPostgresOptions,
  getDatabaseUrlFromProcessEnv,
} from './database.config';

config();

export const AppDataSource = new DataSource({
  ...createPostgresOptions(getDatabaseUrlFromProcessEnv(process.env)),
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
});
