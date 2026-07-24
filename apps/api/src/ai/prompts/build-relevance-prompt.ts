import { Job } from '../../jobs/entities/job.entity';

export function buildRelevancePrompt(job: Job, targetRoles: string): string {
  return `
Eres un reclutador técnico. Un scraper recolecta ofertas de trabajo buscando estos
roles/tecnologías:

${targetRoles}

A veces el scraper trae ofertas que no tienen nada que ver (ej. ventas, almacén,
atención a cliente, manufactura, puestos no técnicos, u otro rubro completamente
distinto). Tu tarea es SOLO decidir si esta oferta pertenece al mismo rubro/ocupación
que se está buscando (desarrollo de software), sin importar el nivel de seniority,
stack específico o si encaja perfecto con un candidato en particular.

OFERTA:
Título: ${job.title}
Empresa: ${job.company ?? 'No especificada'}
Descripción: ${job.description ?? 'No especificada'}

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown:
{
  "relevant": <true si es un puesto de desarrollo de software (o muy cercano, ej. QA/DevOps/data
              técnico), false si es un rubro/ocupación claramente distinto>,
  "reason": "<1 oración corta explicando por qué>"
}
  `.trim();
}
