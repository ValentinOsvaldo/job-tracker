import { Job } from '../../jobs/entities/job.entity';

export function buildWorkModePrompt(job: Job): string {
  return `
Analiza esta oferta de trabajo y determina su modalidad de trabajo y su ubicación normalizada.

Título: ${job.title}
Ubicación (texto crudo del scraper): ${job.location ?? 'No especificada'}
Descripción:
${job.description ?? 'No especificada'}

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown:
{
  "work_mode": "remote" | "hybrid" | "onsite" | "unknown",
  "location_city": "<ciudad principal o null>",
  "location_region": "<estado/provincia o null>",
  "location_country": "<país o null>"
}

Reglas para work_mode:
- "remote": el trabajo se puede hacer 100% a distancia, sin requerir asistencia a oficina.
- "hybrid": combina trabajo remoto con asistencia periódica a oficina.
- "onsite": requiere asistencia presencial a oficina la mayor parte o todo el tiempo.
- "unknown": si no hay información suficiente para decidir con confianza, usa "unknown" en vez de adivinar.

Reglas para la ubicación:
- Normaliza el texto crudo (ej. "CDMX, México" -> city: "Ciudad de México", region: "CDMX", country: "Mexico").
- Si el trabajo es remoto sin una ubicación física relevante, usa null en los tres campos de ubicación.
  `.trim();
}
