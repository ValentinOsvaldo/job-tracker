import { CvAnalysisInput } from '../types/cv-analysis-input.type';

export function buildCvAnalysisPrompt(input: CvAnalysisInput): string {
  const formatKeywords = (items: { term: string; count: number }[]) =>
    items.map((item) => `${item.term} (${item.count})`).join(', ') || 'ninguno';

  const profilesText = input.profiles.length
    ? input.profiles
        .map(
          (p) =>
            `- ${p.name} (${p.role}): ${p.keywords.join(', ') || 'sin keywords'}`,
        )
        .join('\n')
    : 'El usuario todavía no tiene perfiles de búsqueda creados.';

  const historyText =
    input.analyzedJobsCount > 0
      ? `Se han analizado ${input.analyzedJobsCount} ofertas contra este CV, con un fit_score ` +
        `promedio de ${input.avgFitScore?.toFixed(1) ?? 'N/A'}/10.`
      : 'Todavía no hay ofertas analizadas contra este CV.';

  return `
Eres un coach de carrera técnico. Evalúa el siguiente CV y da un puntaje de compatibilidad
con el mercado laboral tech, considerando los perfiles de búsqueda del usuario y el
historial de análisis contra ofertas reales.

PERFILES DE BÚSQUEDA DEL USUARIO:
${profilesText}

HISTORIAL DE ANÁLISIS:
${historyText}

HABILIDADES QUE MÁS COINCIDEN CON LAS OFERTAS ANALIZADAS (fortalezas):
${formatKeywords(input.topStrengths)}

HABILIDADES QUE MÁS PIDEN LAS OFERTAS Y NO ESTÁN EN EL CV (brechas):
${formatKeywords(input.topGaps)}

CV:
${input.cvText}

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown:
{
  "score": <número 0-100, qué tan competitivo es el CV para los perfiles del usuario>,
  "summary": "<2-4 oraciones sobre el estado general del CV>",
  "strengths": [<fortalezas concretas del CV, técnicas o de presentación>],
  "gaps": [<huecos o debilidades del CV frente al mercado>],
  "recommendations": [<3-5 recomendaciones accionables para mejorar el CV o el perfil>]
}
  `.trim();
}
