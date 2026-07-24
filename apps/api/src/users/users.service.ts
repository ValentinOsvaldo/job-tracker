import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateSelfDto } from './dto/update-self.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { PdfParserService } from './pdf-parser.service';
import { CvUploadResult } from './types/cv-upload-result.type';
import { PublicUser } from './types/public-user.type';
import { UploadedPdfFile } from './types/uploaded-pdf-file.type';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly pdfParserService: PdfParserService,
  ) {}

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException(
        `A user with email ${dto.email} already exists`,
      );
    }

    const user = await this.usersRepository.save({
      name: dto.name,
      email: dto.email,
      password: await bcrypt.hash(dto.password, 12),
      role: dto.role ?? UserRole.USER,
    });

    return this.toPublicUser(user);
  }

  findAll(): Promise<PublicUser[]> {
    return this.usersRepository
      .find({ order: { name: 'ASC' } })
      .then((users) => users.map((user) => this.toPublicUser(user)));
  }

  async findPublicById(id: string): Promise<PublicUser> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return this.toPublicUser(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.assertEmailAvailable(dto.email, id);

    const update: Partial<User> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.email !== undefined) update.email = dto.email;
    if (dto.role !== undefined) update.role = dto.role;
    if (dto.password !== undefined) {
      update.password = await bcrypt.hash(dto.password, 12);
    }

    await this.usersRepository.update(id, update);
    const updated = await this.findById(id);
    return this.toPublicUser(updated as User);
  }

  async updateSelf(userId: string, dto: UpdateSelfDto): Promise<PublicUser> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    await this.assertEmailAvailable(dto.email, userId);

    const update: Partial<User> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.email !== undefined) update.email = dto.email;
    if (dto.home_city !== undefined) update.home_city = dto.home_city;
    if (dto.home_country !== undefined) update.home_country = dto.home_country;

    await this.usersRepository.update(userId, update);
    const updated = await this.findById(userId);
    return this.toPublicUser(updated as User);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersRepository.update(userId, {
      password: await bcrypt.hash(dto.newPassword, 12),
    });
  }

  async remove(id: string, requestingUser: PublicUser): Promise<void> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (id === requestingUser.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    if (user.role === UserRole.ADMIN) {
      const adminCount = await this.usersRepository.count({
        where: { role: UserRole.ADMIN },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last remaining admin');
      }
    }

    await this.usersRepository.delete(id);
  }

  private async assertEmailAvailable(
    email: string | undefined,
    excludeId: string,
  ): Promise<void> {
    if (!email) {
      return;
    }

    const existing = await this.usersRepository.findOne({ where: { email } });

    if (existing && existing.id !== excludeId) {
      throw new BadRequestException(
        `A user with email ${email} already exists`,
      );
    }
  }

  async uploadCv(
    id: string,
    file: UploadedPdfFile | undefined,
  ): Promise<CvUploadResult> {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const cvText = await this.pdfParserService.extractText(file.buffer);
    const uploadedAt = new Date();

    await this.usersRepository.update(id, {
      cv_text: cvText,
      cv_filename: file.originalname,
      cv_uploaded_at: uploadedAt,
    });

    return {
      filename: file.originalname,
      characters_extracted: cvText.length,
      uploaded_at: uploadedAt,
    };
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      cv_text: user.cv_text,
      cv_filename: user.cv_filename,
      cv_uploaded_at: user.cv_uploaded_at,
      home_city: user.home_city,
      home_country: user.home_country,
      created_at: user.created_at,
    };
  }
}
