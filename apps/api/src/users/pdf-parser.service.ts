import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class PdfParserService {
  async extractText(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });

    try {
      const { text } = await parser.getText();
      return text.trim();
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Invalid or unreadable PDF file');
    } finally {
      await parser.destroy();
    }
  }
}
