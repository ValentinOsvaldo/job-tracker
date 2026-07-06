import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import {
  createPostgresOptions,
  getDatabaseEnvConfigFromProcessEnv,
} from './config/database.config';
import { Job } from './jobs/entities/job.entity';
import { JobAnalysis } from './job-analyses/entities/job-analysis.entity';
import { SearchProfile } from './profiles/entities/search-profile.entity';
import { RefreshToken } from './users/entities/refresh-token.entity';
import { User } from './users/entities/user.entity';

config();

export default new DataSource({
  ...createPostgresOptions(getDatabaseEnvConfigFromProcessEnv(process.env)),
  entities: [User, RefreshToken, Job, SearchProfile, JobAnalysis],
});
