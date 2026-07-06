import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      cv_text: user.cv_text,
      cv_filename: user.cv_filename,
      cv_uploaded_at: user.cv_uploaded_at,
      created_at: user.created_at,
    };
  }
}
