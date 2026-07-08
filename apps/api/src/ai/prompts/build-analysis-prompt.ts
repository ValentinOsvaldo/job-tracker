import { Job } from '../../jobs/entities/job.entity';
import { SearchProfile } from '../../profiles/entities/search-profile.entity';
import { User } from '../../users/entities/user.entity';

export function buildAnalysisPrompt(
  job: Job,
  profile: SearchProfile,
  user: User,
): string {
  return `
Eres un reclutador técnico experto. Evalúa esta oferta para un desarrollador que busca
un puesto de ${profile.role.toUpperCase()} (perfil: ${profile.name}).

Enfócate EXCLUSIVAMENTE en habilidades relevantes para ${profile.role}.
Aunque el CV tenga experiencia en otras áreas, evalúa solo lo que aplica a este rol.

OFERTA:
Título: ${job.title}
Empresa: ${job.company ?? 'No especificada'}
Descripción: ${job.description ?? 'No especificada'}

CV DE ${user.name}:
${user.cv_text}

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown:
{
  "fit_score": <número 1.0-10.0>,
  "matched_skills": [<skills de ${profile.role} que coinciden>],
  "missing_skills": [<skills de ${profile.role} que pide pero no tiene>],
  "summary": "<2-3 oraciones enfocadas en el match para ${profile.role}>",
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
