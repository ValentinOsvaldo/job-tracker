import { BadRequestException, Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';

@Injectable()
export class PdfParserService {
  async extractText(buffer: Buffer): Promise<string> {
    try {
      const { text } = await pdfParse(buffer);
      return text.trim();
    } catch {
      throw new BadRequestException('Invalid or unreadable PDF file');
    }
  }
}
