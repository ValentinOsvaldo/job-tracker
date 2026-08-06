import { Education, PersonalInfo, Skill } from './resume-profile.types';

export interface TailoredBullet {
  id: string;
  text: string;
  tags: string[];
  relevance_score: number;
  source_bullet_id: string | null;
  source_evidence_id: string | null;
  needs_review: boolean;
}

export interface TailoredExperienceEntry {
  company: string;
  role: string;
  period: string;
  location: string | null;
  bullets: TailoredBullet[];
}

export interface TailoredProject {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string | null;
  relevance_score: number;
  source_project_id: string;
}

export interface TailoredResumeContent {
  personal_info: PersonalInfo;
  summary_variant_used: string | null;
  summary: string;
  skills: Skill[];
  experience: TailoredExperienceEntry[];
  projects: TailoredProject[];
  education: Education[] | null;
}
