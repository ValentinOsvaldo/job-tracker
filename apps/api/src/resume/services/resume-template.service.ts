import { BadRequestException, Injectable } from '@nestjs/common';
// pdfmake's Node entrypoint does `module.exports = new pdfmake()` with no
// esModuleInterop in this project's tsconfig — a default import resolves to
// undefined at runtime, so this needs the CJS-native import form.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import pdfMake = require('pdfmake');
import { RESUME_PDF_FONTS } from '../config/pdf-fonts.config';
import { classicTemplate } from '../templates/classic.template';
import { ResumeTemplateFn } from '../templates/resume-template.types';
import { TailoredResumeContent } from '../types/tailored-resume-content.type';

@Injectable()
export class ResumeTemplateService {
  private readonly templates = new Map<string, ResumeTemplateFn>([
    ['classic', classicTemplate],
  ]);

  constructor() {
    pdfMake.setFonts(RESUME_PDF_FONTS);
    // Resume content is plain text derived from user/AI input, never meant
    // to reference external URLs or local files — deny both outright.
    pdfMake.setUrlAccessPolicy(() => false);
    pdfMake.setLocalAccessPolicy(() => false);
  }

  renderPdf(
    templateId: string,
    resume: TailoredResumeContent,
  ): Promise<Buffer> {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new BadRequestException(`Unknown resume template: ${templateId}`);
    }

    const docDefinition = template(resume);
    const document = pdfMake.createPdf(docDefinition);
    return document.getBuffer();
  }
}
