import { TrendsAnalysisInput } from '../types/trends-analysis-input.type';

export function buildTrendsPrompt(input: TrendsAnalysisInput): string {
  const formatKeywords = (items: { term: string; count: number }[]) =>
    items.map((item) => `${item.term} (${item.count})`).join(', ') || 'ninguno';

  return `
Eres un analista del mercado laboral tech en México. Con base en datos agregados de ofertas
de trabajo recientes, identifica tendencias actuales del mercado.

PERÍODO ANALIZADO: últimos ${input.periodDays} días
TOTAL DE OFERTAS: ${input.totalJobs}

TOP KEYWORDS EN TÍTULOS Y DESCRIPCIONES:
${formatKeywords(input.topKeywords)}

KEYWORDS EN ALZA (vs período anterior):
${formatKeywords(input.risingKeywords)}

TOP SKILLS DEMANDADAS (de análisis previos):
${formatKeywords(input.topSkillsFromAnalyses)}

MUESTRA DE TÍTULOS:
${input.sampleTitles.map((title) => `- ${title}`).join('\n')}

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown:
{
  "summary": "<2-4 oraciones sobre el estado del mercado>",
  "hot_technologies": [<tecnologías más demandadas>],
  "emerging_roles": [<roles o títulos emergentes>],
  "salary_signals": "<breve observación sobre salarios o null>",
  "recommendations": [<2-4 recomendaciones concretas para candidatos>]
}
  `.trim();
}
