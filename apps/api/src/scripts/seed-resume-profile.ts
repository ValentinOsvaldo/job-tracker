import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module';
import { UpsertResumeProfileDto } from '../resume/dto/resume-profile/upsert-resume-profile.dto';
import { ResumeProfileService } from '../resume/services/resume-profile.service';
import { camelToSnakeDeep } from '../resume/utils/case-convert';
import { UsersService } from '../users/users.service';

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};

  for (const arg of argv) {
    const match = /^--([a-zA-Z]+)=(.+)$/.exec(arg);
    if (match) {
      args[match[1]] = match[2];
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = args.file ?? join(__dirname, 'resume-profile.sample.json');

  const raw: unknown = JSON.parse(readFileSync(filePath, 'utf-8'));
  const normalized = camelToSnakeDeep(raw);
  const dto = plainToInstance(UpsertResumeProfileDto, normalized);
  const errors = validateSync(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    console.error(`Invalid resume profile JSON in ${filePath}:`);
    for (const error of errors) {
      console.error(error.toString());
    }
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const usersService = app.get(UsersService);
    const user = await usersService.getLocalUser();
    const resumeProfileService = app.get(ResumeProfileService);
    const saved = await resumeProfileService.upsert(user.id, dto);
    console.log(`Resume profile saved for ${user.email} (id=${saved.id})`);
  } finally {
    await app.close();
  }
}

void main();
