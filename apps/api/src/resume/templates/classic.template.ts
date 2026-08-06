import { PersonalInfo } from '../types/resume-profile.types';
import { TailoredResumeContent } from '../types/tailored-resume-content.type';
import { ResumeTemplateFn } from './resume-template.types';

function buildContactLine(info: PersonalInfo): string {
  return [
    info.email,
    info.phone,
    info.location,
    ...info.links.map((link) => link.url),
  ]
    .filter((part): part is string => !!part)
    .join('  ·  ');
}

export const classicTemplate: ResumeTemplateFn = (
  resume: TailoredResumeContent,
) => ({
  pageSize: 'A4',
  pageMargins: [40, 40, 40, 40],
  defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.2 },
  styles: {
    name: { fontSize: 20, bold: true, margin: [0, 0, 0, 2] },
    headline: { fontSize: 12, color: '#444444', margin: [0, 0, 0, 2] },
    contact: { fontSize: 9, color: '#666666', margin: [0, 0, 0, 12] },
    sectionHeader: {
      fontSize: 12,
      bold: true,
      margin: [0, 10, 0, 4],
      decoration: 'underline',
    },
    roleCompany: { fontSize: 10, bold: true },
    period: { fontSize: 9, color: '#666666', italics: true },
    bulletText: { fontSize: 10, margin: [0, 1, 0, 1] },
  },
  content: [
    { text: resume.personal_info.full_name, style: 'name' },
    ...(resume.personal_info.headline
      ? [{ text: resume.personal_info.headline, style: 'headline' }]
      : []),
    { text: buildContactLine(resume.personal_info), style: 'contact' },

    { text: 'Resumen', style: 'sectionHeader' },
    { text: resume.summary },

    ...(resume.experience.length > 0
      ? [
          { text: 'Experiencia', style: 'sectionHeader' },
          ...resume.experience.flatMap((entry) => [
            {
              columns: [
                {
                  text: `${entry.role} · ${entry.company}`,
                  style: 'roleCompany',
                },
                { text: entry.period, style: 'period', alignment: 'right' },
              ],
            },
            ...(entry.location
              ? [{ text: entry.location, style: 'period' }]
              : []),
            {
              ul: entry.bullets.map((bullet) => ({
                text: bullet.text,
                style: 'bulletText',
              })),
              margin: [0, 2, 0, 6],
            },
          ]),
        ]
      : []),

    ...(resume.skills.length > 0
      ? [
          { text: 'Habilidades', style: 'sectionHeader' },
          { text: resume.skills.map((skill) => skill.name).join(', ') },
        ]
      : []),

    ...(resume.projects.length > 0
      ? [
          { text: 'Proyectos', style: 'sectionHeader' },
          ...resume.projects.map((project) => ({
            text: [
              { text: `${project.name}: `, bold: true },
              project.description,
            ],
            margin: [0, 1, 0, 4] as [number, number, number, number],
          })),
        ]
      : []),

    ...(resume.education && resume.education.length > 0
      ? [
          { text: 'Educación', style: 'sectionHeader' },
          ...resume.education.map((education) => ({
            text: `${education.degree} — ${education.institution}${education.period ? ` (${education.period})` : ''}`,
            margin: [0, 1, 0, 2] as [number, number, number, number],
          })),
        ]
      : []),
  ],
});
