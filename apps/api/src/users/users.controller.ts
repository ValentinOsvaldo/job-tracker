import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
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
import { CvUploadResultDto } from './dto/cv-upload-result.dto';
import { PublicUserDto } from './dto/public-user.dto';
import { UploadedPdfFile } from './types/uploaded-pdf-file.type';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: [PublicUserDto] })
  findAll() {
    return this.usersService.findAll();
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
