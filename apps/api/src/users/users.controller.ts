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
import { UploadedPdfFile } from './types/uploaded-pdf-file.type';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findPublicById(id);
  }

  @Post(':id/cv')
  @UseInterceptors(FileInterceptor('file'))
  uploadCv(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedPdfFile | undefined,
  ) {
    return this.usersService.uploadCv(id, file);
  }
}
