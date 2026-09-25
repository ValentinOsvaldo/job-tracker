import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvAnalysisModule } from '../cv-analysis/cv-analysis.module';
import { ResumeModule } from '../resume/resume.module';
import { User } from './entities/user.entity';
import { PdfParserService } from './pdf-parser.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CvAnalysisModule, ResumeModule],
  controllers: [UsersController],
  providers: [UsersService, PdfParserService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
