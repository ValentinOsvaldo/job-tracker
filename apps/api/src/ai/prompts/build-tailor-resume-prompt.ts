import { Job } from '../../jobs/entities/job.entity';
import { ResumeProfile } from '../../resume/entities/resume-profile.entity';

export function buildTailorResumePrompt(
  job: Job,
  profile: ResumeProfile,
): string {
  const summaryVariants = Object.entries(profile.summary)
    .map(([key, text]) => `  - "${key}": ${text}`)
    .join('\n');

  const skillsList = profile.skills
    .map(
      (skill) =>
        `  - ${skill.name} (nivel: ${skill.level}, tags: ${skill.tags.join(', ') || 'ninguno'})`,
    )
    .join('\n');

  const experienceBlock = profile.experience
    .map((entry) => {
      const bullets = entry.bullets
        .map((bullet) => `      - id="${bullet.id}": ${bullet.text}`)
        .join('\n');
      return `  - ${entry.company} · ${entry.role} · ${entry.period}\n${bullets}`;
    })
    .join('\n');

  const evidenceBlock = profile.skill_evidence
    .map(
      (evidence) =>
        `  - id="${evidence.id}" (confidence: ${evidence.confidence}): ${evidence.raw_fact}` +
        (evidence.impact ? ` — impacto: ${evidence.impact}` : ''),
    )
    .join('\n');

  const projectsBlock = profile.projects
    .map(
      (project) =>
        `  - id="${project.id}": ${project.name} — ${project.description}`,
    )
    .join('\n');

  return `
Eres un asistente que adapta el CV de un candidato a una vacante específica. Tu única fuente de
información sobre el candidato es el perfil de abajo — NUNCA inventes tecnologías, cifras, empresas
o logros que no estén explícitamente presentes ahí.

VACANTE:
Título: ${job.title}
Empresa: ${job.company ?? 'No especificada'}
Descripción: ${job.description ?? 'No especificada'}

VARIANTES DE RESUMEN DISPONIBLES (elige la más adecuada para esta vacante, o repórtala reformulada):
${summaryVariants || '  (ninguna)'}

SKILLS DEL PERFIL:
${skillsList || '  (ninguna)'}

EXPERIENCIA (cada bullet trae su id — DEBES referenciarlo si generas un bullet a partir de él):
${experienceBlock || '  (ninguna)'}

EVIDENCIA DE SKILLS AÚN NO CONVERTIDA EN BULLETS (cada una trae su id y su nivel de confianza):
${evidenceBlock || '  (ninguna)'}

PROYECTOS:
${projectsBlock || '  (ninguno)'}

REGLAS OBLIGATORIAS:
1. Solo puedes usar bullets y evidencia de ESTE perfil. Nunca inventes tecnologías, cifras, empresas
   o logros que no estén explícitamente presentes arriba.
2. Puedes reformular el texto de un bullet o de una evidencia para reflejar las palabras clave de la
   vacante (para ATS), pero el hecho subyacente no puede cambiar. Cada bullet que generes DEBE incluir
   "source_bullet_id" o "source_evidence_id" apuntando al id exacto del que proviene.
3. Elige la variante de resumen más adecuada para esta vacante y regresa su nombre en
   "summary_variant_used", junto con el texto (posiblemente reformulado) en "summary_text".
4. Selecciona como máximo 4 bullets por rol de experiencia, priorizando los más relevantes para esta
   vacante; el currículum completo debe caber en aproximadamente 1 página.
5. Un hecho de evidencia con confidence "low" NUNCA debe convertirse en un bullet de logro; a lo más,
   la skill relacionada puede aparecer en la lista de skills.
6. No incluyas nada relacionado con educación ni datos personales (nombre, contacto) — eso se agrega
   por separado y no forma parte de tu respuesta.
7. "relevance_score" es un entero 0-100 que indica qué tan relevante es ese bullet/proyecto para ESTA
   vacante específica.

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown, con este schema exacto:
{
  "summary_variant_used": "<nombre de la variante elegida>",
  "summary_text": "<texto del resumen, posiblemente reformulado>",
  "skills": [
    { "name": "<nombre exacto de una skill del perfil>", "tags": [...], "level": "<nivel>" }
  ],
  "experience": [
    {
      "company": "<empresa exacta del perfil>",
      "role": "<rol exacto del perfil>",
      "period": "<periodo exacto del perfil>",
      "bullets": [
        {
          "source_bullet_id": "<id del bullet original, o null>",
          "source_evidence_id": "<id de la evidencia original, o null>",
          "text": "<texto del bullet, posiblemente reformulado>",
          "tags": [...],
          "relevance_score": <0-100>
        }
      ]
    }
  ],
  "projects": [
    {
      "source_project_id": "<id exacto de un proyecto del perfil>",
      "text_override": "<descripción reformulada, o null para dejar la original>",
      "relevance_score": <0-100>
    }
  ]
}
  `.trim();
}
