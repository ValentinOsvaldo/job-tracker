import { Job } from '../../jobs/entities/job.entity';
import { SearchProfile } from '../../profiles/entities/search-profile.entity';
import { User } from '../../users/entities/user.entity';

function formatRange(
  min: number | null,
  max: number | null,
  currency: string,
): string | null {
  if (min == null && max == null) {
    return null;
  }

  if (min != null && max != null) {
    return `${min}-${max} ${currency}`;
  }

  return min != null ? `desde ${min} ${currency}` : `hasta ${max} ${currency}`;
}

function buildSalaryExpectationLine(profile: SearchProfile): string {
  const ranges = [
    formatRange(profile.salary_min_mxn, profile.salary_max_mxn, 'MXN'),
    formatRange(profile.salary_min_usd, profile.salary_max_usd, 'USD'),
  ].filter((range): range is string => range !== null);

  if (ranges.length === 0) {
    return '';
  }

  return (
    `\nEXPECTATIVA SALARIAL DEL CANDIDATO: ${ranges.join(' y/o ')}. Considera esto al calcular el ` +
    `fit_score y menciónalo en el summary si el salario de la oferta (estimado o explícito) ` +
    `parece quedar claramente por debajo de esa expectativa (compara contra el rango en la misma ` +
    `moneda que la oferta cuando esté disponible; si ninguna moneda coincide, solo una observación ` +
    `cualitativa, sin hacer conversión de moneda).\n`
  );
}

export function buildAnalysisPrompt(
  job: Job,
  profile: SearchProfile,
  user: User,
): string {
  return `
Eres un reclutador técnico experto y ESTRICTO. Evalúa esta oferta para un desarrollador que busca
un puesto de ${profile.role.toUpperCase()} (perfil: ${profile.name}).

Enfócate EXCLUSIVAMENTE en habilidades relevantes para ${profile.role}.
Aunque el CV tenga experiencia en otras áreas, evalúa solo lo que aplica a este rol.
${buildSalaryExpectationLine(profile)}
OFERTA:
Título: ${job.title}
Empresa: ${job.company ?? 'No especificada'}
Descripción: ${job.description ?? 'No especificada'}

CV DE ${user.name}:
${user.cv_text}

REGLAS PARA CALIFICAR fit_score (sé conservador, no optimista):
- No asumas que el candidato tiene una skill si no aparece explícita o claramente implícita en el CV.
  Ante la duda, cuéntala como missing_skill, no como matched_skill.
- Los requisitos marcados como obligatorios/"required"/"must have" en la oferta pesan mucho más que
  los "nice to have" o deseables. Cada requisito obligatorio que falte debe bajar el score de forma notoria.
- Si la oferta pide un seniority o años de experiencia claramente por encima de lo que el CV demuestra
  para ${profile.role}, el score no puede pasar de 5.0 aunque el stack coincida.
- Si falta más de la mitad de las tecnologías clave del stack pedido para ${profile.role}, el score no
  puede pasar de 4.0.
- Usa estas anclas como referencia:
  9.0-10.0: cumple prácticamente todos los requisitos obligatorios y el seniority pedido; aplicar es casi seguro.
  7.0-8.9: cumple la mayoría de los requisitos obligatorios, con 1-2 gaps menores o solo en nice-to-haves.
  5.0-6.9: cumple lo básico del rol pero le faltan 2 o más requisitos obligatorios, o hay mismatch de seniority.
  3.0-4.9: el área/rol coincide en general pero el stack o la experiencia difieren de forma sustancial.
  1.0-2.9: no cumple el rol o el stack principal pedido; aplicar sería un tiro al aire.
- No redondees hacia arriba "para no desanimar" al candidato: el objetivo es predecir el riesgo real de
  rechazo, no motivar. Es preferible un score bajo correcto a uno alto que termine en rechazo.

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown:
{
  "fit_score": <número 1.0-10.0, aplicando las reglas anteriores>,
  "matched_skills": [<skills de ${profile.role} que coinciden, solo si están claramente respaldadas por el CV>],
  "missing_skills": [<skills de ${profile.role} que pide la oferta pero el CV no respalda, priorizando las obligatorias>],
  "summary": "<2-3 oraciones enfocadas en el match para ${profile.role}, mencionando explícitamente si hay riesgo de rechazo por requisitos obligatorios faltantes o mismatch de seniority>",
  "salary_min": <entero en MXN o null>,
  "salary_max": <entero en MXN o null>,
  "salary_is_inferred": <true si lo estimaste, false si era explícito>,
  "benefits": [<prestaciones mencionadas o inferidas>],
  "benefits_is_inferred": <true si los inferiste>
}

Sobre el salario: si no se menciona, estímalo según el rol ${profile.role},
seniority requerido, stack y mercado mexicano. Marca salary_is_inferred: true.
Si no hay información suficiente, usa null.
  `.trim();
}
