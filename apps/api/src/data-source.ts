import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import {
  createPostgresOptions,
  getDatabaseEnvConfigFromProcessEnv,
} from './config/database.config';
import { RefreshToken } from './users/entities/refresh-token.entity';
import { User } from './users/entities/user.entity';

config();

export default new DataSource({
  ...createPostgresOptions(getDatabaseEnvConfigFromProcessEnv(process.env)),
  entities: [User, RefreshToken],
});
