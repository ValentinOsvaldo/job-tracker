import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CvAnalysisService } from '../cv-analysis/cv-analysis.service';
import { AtsCheckResponseDto } from '../cv-analysis/dto/ats-check-response.dto';
import { CvAnalysisQueryDto } from '../cv-analysis/dto/cv-analysis-query.dto';
import { CvAnalysisResponseDto } from '../cv-analysis/dto/cv-analysis-response.dto';
import { UpsertResumeProfileDto } from '../resume/dto/resume-profile/upsert-resume-profile.dto';
import { ResumeProfile } from '../resume/entities/resume-profile.entity';
import { ResumeProfileService } from '../resume/services/resume-profile.service';
import { PublicUser } from './types/public-user.type';
import { CvUploadResultDto } from './dto/cv-upload-result.dto';
import { PublicUserDto } from './dto/public-user.dto';
import { UpdateSelfDto } from './dto/update-self.dto';
import { UploadedPdfFile } from './types/uploaded-pdf-file.type';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cvAnalysisService: CvAnalysisService,
    private readonly resumeProfileService: ResumeProfileService,
  ) {}

  @Get('me/resume-profile')
  @ApiOperation({
    summary: "Get the current user's structured resume profile",
    description:
      'Used to generate AI-tailored resumes per job application. Distinct from the plain-text CV used for scoring/ATS check.',
  })
  @ApiResponse({
    status: 200,
    type: ResumeProfile,
    description: 'Null when the user has not created a resume profile yet',
  })
  getResumeProfile(@Req() req: { user: PublicUser }) {
    return this.resumeProfileService.findByUserOrNull(req.user.id);
  }

  @Put('me/resume-profile')
  @ApiOperation({
    summary:
      "Create or fully replace the current user's structured resume profile",
  })
  @ApiBody({ type: UpsertResumeProfileDto })
  @ApiResponse({ status: 200, type: ResumeProfile })
  @ApiResponse({ status: 400, description: 'Malformed resume profile payload' })
  updateResumeProfile(
    @Req() req: { user: PublicUser },
    @Body() dto: UpsertResumeProfileDto,
  ) {
    return this.resumeProfileService.upsert(req.user.id, dto);
  }

  @Get('me/cv-analysis')
  @ApiOperation({
    summary:
      'Get an AI-generated CV score and market-fit analysis for the current user',
  })
  @ApiResponse({ status: 200, type: CvAnalysisResponseDto })
  @ApiResponse({ status: 400, description: 'No CV uploaded yet' })
  getCvAnalysis(
    @Req() req: { user: PublicUser },
    @Query() query: CvAnalysisQueryDto,
  ) {
    return this.cvAnalysisService.getCvAnalysis(req.user.id, query.refresh);
  }

  @Get('me/ats-check')
  @ApiOperation({
    summary:
      "Get a deterministic ATS compatibility check for the current user's CV",
    description:
      'Reuses the same CV text and matched/missing skill aggregates as the CV score & market fit analysis, scored against mechanical ATS heuristics (no AI call).',
  })
  @ApiResponse({ status: 200, type: AtsCheckResponseDto })
  @ApiResponse({ status: 400, description: 'No CV uploaded yet' })
  getAtsCheck(@Req() req: { user: PublicUser }) {
    return this.cvAnalysisService.getAtsCheck(req.user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the current user' })
  @ApiResponse({ status: 200, type: PublicUserDto })
  me(@Req() req: { user: PublicUser }) {
    return req.user;
  }

  @Patch('me')
  @ApiOperation({ summary: "Update the current user's name and/or email" })
  @ApiResponse({ status: 200, type: PublicUserDto })
  updateSelf(@Req() req: { user: PublicUser }, @Body() dto: UpdateSelfDto) {
    return this.usersService.updateSelf(req.user.id, dto);
  }

  @Post('me/cv')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a PDF CV for the current user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'PDF file' },
      },
    },
  })
  @ApiResponse({ status: 201, type: CvUploadResultDto })
  @ApiResponse({ status: 400, description: 'Invalid or missing PDF file' })
  @ApiResponse({ status: 404, description: 'User not found' })
  uploadCv(
    @Req() req: { user: PublicUser },
    @UploadedFile() file: UploadedPdfFile | undefined,
  ) {
    return this.usersService.uploadCv(req.user.id, file);
  }
}
