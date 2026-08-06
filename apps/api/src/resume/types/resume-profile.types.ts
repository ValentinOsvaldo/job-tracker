import { EvidenceConfidence } from '../enums/evidence-confidence.enum';
import { SkillLevel } from '../enums/skill-level.enum';

export interface Link {
  label: string;
  url: string;
}

export interface PersonalInfo {
  full_name: string;
  headline: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  links: Link[];
}

/** Named summary variants the user maintains, e.g. { frontend_heavy: "...", fullstack_heavy: "..." }. */
export type SummaryVariants = Record<string, string>;

export interface Skill {
  name: string;
  tags: string[];
  level: SkillLevel;
}

export interface Bullet {
  id: string;
  text: string;
  tags: string[];
}

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  location: string | null;
  bullets: Bullet[];
}

export interface SkillEvidenceItem {
  id: string;
  context: string;
  raw_fact: string;
  impact: string | null;
  confidence: EvidenceConfidence;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string | null;
}

export interface Education {
  institution: string;
  degree: string;
  period: string | null;
  location: string | null;
}
