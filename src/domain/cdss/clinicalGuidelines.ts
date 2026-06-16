export interface ClinicalGuidelineEntity {
  id: string;
  title: string;
  titleAr?: string;
  condition: string;
  category: string;
  summary?: string;
  summaryAr?: string;
  recommendations: ClinicalRecommendationItem[];
  evidenceLevel?: string;
  source?: string;
  version?: string;
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicalRecommendationItem {
  id: string;
  text: string;
  textAr?: string;
  strength: 'strong' | 'weak' | 'conditional';
  evidenceQuality: 'high' | 'moderate' | 'low' | 'very_low';
}

export interface GuidelineFilter {
  condition?: string;
  category?: string;
  isActive?: boolean;
  evidenceLevel?: string;
}

export function filterGuidelines(
  guidelines: ClinicalGuidelineEntity[],
  filter: GuidelineFilter,
): ClinicalGuidelineEntity[] {
  return guidelines.filter((g) => {
    if (filter.condition && g.condition !== filter.condition) return false;
    if (filter.category && g.category !== filter.category) return false;
    if (filter.isActive !== undefined && g.isActive !== filter.isActive) return false;
    if (filter.evidenceLevel && g.evidenceLevel !== filter.evidenceLevel) return false;
    return true;
  });
}

export function getGuidelinesByCondition(
  guidelines: ClinicalGuidelineEntity[],
  condition: string,
): ClinicalGuidelineEntity[] {
  return guidelines.filter(
    (g) => g.condition.toLowerCase() === condition.toLowerCase() && g.isActive,
  );
}
