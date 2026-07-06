import 'reflect-metadata';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { User } from './users/entities/user.entity';

config();

const seedUsers = [
  {
    name: 'Osvaldo',
    email: 'osvaldo@example.com',
    passwordEnv: 'SEED_USER_OSVALDO_PASSWORD',
  },
  {
    name: 'Guillermo',
    email: 'guillermo@example.com',
    passwordEnv: 'SEED_USER_GUILLERMO_PASSWORD',
  },
];

async function seed() {
  await dataSource.initialize();
  const usersRepository = dataSource.getRepository(User);

  for (const seedUser of seedUsers) {
    const existingUser = await usersRepository.findOne({
      where: { email: seedUser.email },
    });

    if (existingUser) {
      console.log(`Skipping existing user: ${seedUser.email}`);
      continue;
    }

    const password = process.env[seedUser.passwordEnv];

    if (!password) {
      throw new Error(`Missing environment variable: ${seedUser.passwordEnv}`);
    }

    await usersRepository.save({
      name: seedUser.name,
      email: seedUser.email,
      password: await bcrypt.hash(password, 12),
    });

    console.log(`Created user: ${seedUser.email}`);
  }

  await dataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
