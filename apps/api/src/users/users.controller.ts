import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CvAnalysisService } from '../cv-analysis/cv-analysis.service';
import { CvAnalysisQueryDto } from '../cv-analysis/dto/cv-analysis-query.dto';
import { CvAnalysisResponseDto } from '../cv-analysis/dto/cv-analysis-response.dto';
import { PublicUser } from './types/public-user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { CvUploadResultDto } from './dto/cv-upload-result.dto';
import { PublicUserDto } from './dto/public-user.dto';
import { UserRole } from './enums/user-role.enum';
import { UploadedPdfFile } from './types/uploaded-pdf-file.type';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cvAnalysisService: CvAnalysisService,
  ) {}

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

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: [PublicUserDto] })
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({ status: 201, type: PublicUserDto })
  @ApiResponse({ status: 400, description: 'Email already in use' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: PublicUserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findPublicById(id);
  }

  @Post(':id/cv')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a PDF CV for a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
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
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedPdfFile | undefined,
  ) {
    return this.usersService.uploadCv(id, file);
  }
}
