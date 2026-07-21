import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvAnalysisModule } from '../cv-analysis/cv-analysis.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { PdfParserService } from './pdf-parser.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken]), CvAnalysisModule],
  controllers: [UsersController],
  providers: [UsersService, PdfParserService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
