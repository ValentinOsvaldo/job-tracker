import { AtsCheckItem, AtsCheckStatus } from '../types/ats-check-response.type';

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_PATTERN = /(\+?\d[\d\s().-]{7,}\d)/;

const SECTION_KEYWORDS: Record<string, RegExp> = {
  experience:
    /experiencia laboral|experiencia profesional|historial laboral|\bexperience\b|work experience/i,
  education: /educaci[oó]n|formaci[oó]n acad[eé]mica|estudios|\beducation\b/i,
  skills:
    /habilidades|competencias|conocimientos t[eé]cnicos|\bskills\b|tecnolog[ií]as/i,
};

/** Very short extracted text usually means the PDF was image-based, or
 * leaned heavily on tables/columns/graphics that pdf-parse can't read —
 * the same content an ATS parser tends to choke on. */
export function checkFormatQuality(cvText: string): AtsCheckItem {
  const length = cvText.trim().length;
  let status: AtsCheckStatus = 'ok';
  let detail = `Se extrajeron ${length.toLocaleString()} caracteres de texto.`;

  if (length < 100) {
    status = 'error';
    detail = `Solo se extrajeron ${length} caracteres. El PDF probablemente usa imágenes, tablas o columnas que un ATS no puede leer.`;
  } else if (length < 500) {
    status = 'warning';
    detail = `Solo se extrajeron ${length} caracteres, menos de lo esperado para un CV completo. Revisa si usa tablas, columnas o imágenes.`;
  }

  return {
    key: 'format_quality',
    label:
      'Formato compatible (texto extraíble, sin imágenes/tablas complejas)',
    status,
    detail,
  };
}

export function checkContactInfo(cvText: string): AtsCheckItem {
  const hasEmail = EMAIL_PATTERN.test(cvText);
  const hasPhone = PHONE_PATTERN.test(cvText);

  let status: AtsCheckStatus = 'ok';
  let detail = 'Se detectaron correo electrónico y teléfono.';

  if (!hasEmail && !hasPhone) {
    status = 'error';
    detail = 'No se detectó correo electrónico ni teléfono como texto.';
  } else if (!hasEmail) {
    status = 'warning';
    detail = 'No se detectó un correo electrónico como texto.';
  } else if (!hasPhone) {
    status = 'warning';
    detail = 'No se detectó un teléfono como texto.';
  }

  return {
    key: 'contact_info',
    label: 'Información de contacto detectable',
    status,
    detail,
  };
}

export function checkStandardSections(cvText: string): AtsCheckItem {
  const found = Object.entries(SECTION_KEYWORDS).filter(([, pattern]) =>
    pattern.test(cvText),
  );
  const missing = Object.keys(SECTION_KEYWORDS).filter(
    (key) => !found.some(([foundKey]) => foundKey === key),
  );

  let status: AtsCheckStatus = 'ok';
  let detail =
    'Se detectaron encabezados estándar de experiencia, educación y habilidades.';

  if (found.length <= 1) {
    status = 'error';
    detail = `No se detectaron encabezados de sección estándar (faltan: ${missing.join(', ')}).`;
  } else if (found.length === 2) {
    status = 'warning';
    detail = `Falta un encabezado de sección estándar: ${missing.join(', ')}.`;
  }

  return {
    key: 'standard_sections',
    label:
      'Encabezados de sección estándar (experiencia, educación, habilidades)',
    status,
    detail,
  };
}

/** Coverage of the skills real job postings actually asked for, computed
 * from the same matched/missing skill aggregates the CV score & market fit
 * feature already builds from job_analyses. */
export function checkKeywordCoverage(
  matchedCount: number,
  missingCount: number,
): AtsCheckItem {
  const total = matchedCount + missingCount;

  if (total === 0) {
    return {
      key: 'keyword_coverage',
      label: 'Cobertura de keywords de ofertas analizadas',
      status: 'neutral',
      detail:
        'Todavía no hay ofertas analizadas contra este CV para medir cobertura de keywords.',
    };
  }

  const coverage = Math.round((matchedCount / total) * 100);
  let status: AtsCheckStatus = 'ok';

  if (coverage < 30) {
    status = 'error';
  } else if (coverage < 60) {
    status = 'warning';
  }

  return {
    key: 'keyword_coverage',
    label: 'Cobertura de keywords de ofertas analizadas',
    status,
    detail: `El CV cubre ${coverage}% de las keywords que pidieron las ofertas analizadas (${matchedCount}/${total}).`,
  };
}

const STATUS_SCORE: Record<AtsCheckStatus, number> = {
  ok: 1,
  warning: 0.5,
  error: 0,
  neutral: 0.5,
};

const CHECK_WEIGHTS: Record<string, number> = {
  format_quality: 25,
  contact_info: 15,
  standard_sections: 20,
  keyword_coverage: 40,
};

export function scoreAtsChecks(checks: AtsCheckItem[]): number {
  const total = checks.reduce(
    (sum, check) =>
      sum + (CHECK_WEIGHTS[check.key] ?? 0) * STATUS_SCORE[check.status],
    0,
  );

  return Math.round(total);
}

export function buildAtsRecommendations(checks: AtsCheckItem[]): string[] {
  const recommendations: string[] = [];

  for (const check of checks) {
    if (check.status === 'ok' || check.status === 'neutral') continue;

    switch (check.key) {
      case 'format_quality':
        recommendations.push(
          'Evita imágenes, tablas o columnas complejas en el CV — usa un formato de texto simple de arriba a abajo.',
        );
        break;
      case 'contact_info':
        recommendations.push(
          'Incluye tu correo electrónico y teléfono como texto plano (no como imagen) al inicio del CV.',
        );
        break;
      case 'standard_sections':
        recommendations.push(
          "Usa encabezados de sección estándar como 'Experiencia', 'Educación' y 'Habilidades' para que el ATS los reconozca.",
        );
        break;
      case 'keyword_coverage':
        recommendations.push(
          'Agrega las palabras clave que más piden las ofertas analizadas y que le falten a tu CV (ver sección de brechas en CV score & market fit).',
        );
        break;
    }
  }

  return recommendations;
}
