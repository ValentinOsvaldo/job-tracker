import { Job } from '../../jobs/entities/job.entity';

export function buildSummaryPrompt(job: Job): string {
  return `
Resume la siguiente oferta de trabajo en 2-3 oraciones en español, en texto plano
(sin markdown, sin listas, sin comillas). Enfócate en el rol, el stack/tecnologías
principales y cualquier dato clave (seniority, modalidad, ubicación) si está disponible.

Título: ${job.title}
Empresa: ${job.company ?? 'No especificada'}
Descripción:
${job.description ?? 'No especificada'}

Responde ÚNICAMENTE con el texto del resumen, sin prefijos ni formato adicional.
  `.trim();
}
