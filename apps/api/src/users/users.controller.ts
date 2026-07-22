import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { OkResponseDto } from '../common/dto/ok-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CvAnalysisService } from '../cv-analysis/cv-analysis.service';
import { CvAnalysisQueryDto } from '../cv-analysis/dto/cv-analysis-query.dto';
import { CvAnalysisResponseDto } from '../cv-analysis/dto/cv-analysis-response.dto';
import { PublicUser } from './types/public-user.type';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CvUploadResultDto } from './dto/cv-upload-result.dto';
import { PublicUserDto } from './dto/public-user.dto';
import { UpdateSelfDto } from './dto/update-self.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, type: [PublicUserDto] })
  @ApiResponse({ status: 403, description: 'Admin role required' })
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

  @Patch('me')
  @ApiOperation({ summary: "Update the current user's name and/or email" })
  @ApiResponse({ status: 200, type: PublicUserDto })
  @ApiResponse({ status: 400, description: 'Email already in use' })
  updateSelf(@Req() req: { user: PublicUser }, @Body() dto: UpdateSelfDto) {
    return this.usersService.updateSelf(req.user.id, dto);
  }

  @Patch('me/password')
  @HttpCode(200)
  @ApiOperation({ summary: "Change the current user's password" })
  @ApiResponse({ status: 200, type: OkResponseDto })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @Req() req: { user: PublicUser },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(req.user.id, dto);
    return { ok: true };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a user by ID (admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: PublicUserDto })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findPublicById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user (admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: PublicUserDto })
  @ApiResponse({ status: 400, description: 'Email already in use' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: OkResponseDto })
  @ApiResponse({
    status: 403,
    description:
      'Admin role required, or attempted to delete yourself / the last admin',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.usersService.remove(id, req.user);
    return { ok: true };
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
  @ApiResponse({ status: 403, description: 'Can only upload your own CV' })
  @ApiResponse({ status: 404, description: 'User not found' })
  uploadCv(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedPdfFile | undefined,
  ) {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('You can only upload your own CV');
    }

    return this.usersService.uploadCv(id, file);
  }
}
