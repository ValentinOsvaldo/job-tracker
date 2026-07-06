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
import { PublicUser } from '../users/types/public-user.type';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  findAll(@Req() req: { user: PublicUser }) {
    return this.profilesService.findAllByUserId(req.user.id);
  }

  @Post()
  create(@Req() req: { user: PublicUser }, @Body() dto: CreateProfileDto) {
    return this.profilesService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.profilesService.remove(req.user.id, id);
    return { ok: true };
  }
}
