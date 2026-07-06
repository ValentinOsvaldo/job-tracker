import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OkResponseDto } from '../common/dto/ok-response.dto';
import { PublicUser } from '../users/types/public-user.type';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchProfile } from './entities/search-profile.entity';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@ApiBearerAuth('access-token')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'List search profiles for the current user' })
  @ApiResponse({ status: 200, type: [SearchProfile] })
  findAll(@Req() req: { user: PublicUser }) {
    return this.profilesService.findAllByUserId(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a search profile' })
  @ApiResponse({ status: 201, type: SearchProfile })
  create(@Req() req: { user: PublicUser }, @Body() dto: CreateProfileDto) {
    return this.profilesService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a search profile' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: SearchProfile })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  update(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a search profile' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: OkResponseDto })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async remove(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.profilesService.remove(req.user.id, id);
    return { ok: true };
  }
}
