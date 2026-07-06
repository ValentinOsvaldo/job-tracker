import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SeedResultDto } from './dto/seed-result.dto';

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

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async seed(): Promise<SeedResultDto> {
    const created: string[] = [];
    const skipped: string[] = [];

    for (const seedUser of seedUsers) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: seedUser.email },
      });

      if (existingUser) {
        skipped.push(seedUser.email);
        continue;
      }

      const password = this.configService.get<string>(seedUser.passwordEnv);

      if (!password) {
        throw new Error(
          `Missing environment variable: ${seedUser.passwordEnv}`,
        );
      }

      await this.usersRepository.save({
        name: seedUser.name,
        email: seedUser.email,
        password: await bcrypt.hash(password, 12),
      });

      created.push(seedUser.email);
    }

    return { created, skipped };
  }
}
