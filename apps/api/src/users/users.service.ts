import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSelfDto } from './dto/update-self.dto';
import { User } from './entities/user.entity';
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

  // Single-user app: the oldest user row is "the" user (the SingleUserMode
  // migration guarantees one exists).
  async getLocalUser(): Promise<PublicUser> {
    const [user] = await this.usersRepository.find({
      order: { created_at: 'ASC' },
      take: 1,
    });

    if (!user) {
      throw new NotFoundException('No user found — did migrations run?');
    }

    return this.toPublicUser(user);
  }

  async updateSelf(userId: string, dto: UpdateSelfDto): Promise<PublicUser> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const update: Partial<User> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.email !== undefined) update.email = dto.email;
    if (dto.home_city !== undefined) update.home_city = dto.home_city;
    if (dto.home_country !== undefined) update.home_country = dto.home_country;

    await this.usersRepository.update(userId, update);
    const updated = await this.findById(userId);
    return this.toPublicUser(updated as User);
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

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      cv_text: user.cv_text,
      cv_filename: user.cv_filename,
      cv_uploaded_at: user.cv_uploaded_at,
      home_city: user.home_city,
      home_country: user.home_country,
      created_at: user.created_at,
    };
  }
}
