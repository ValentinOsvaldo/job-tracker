import { TailoredResumeContent } from '../types/tailored-resume-content.type';

// pdfmake's TDocumentDefinitions has no shipped type declarations (see
// resume/types/pdfmake.d.ts) — treated as a plain object shape here.
export type ResumeTemplateFn = (
  resume: TailoredResumeContent,
) => Record<string, unknown>;
