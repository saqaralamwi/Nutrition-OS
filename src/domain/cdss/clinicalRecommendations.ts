export interface ClinicalRecommendationEntity {
  id: string;
  patientId?: string;
  guidelineId?: string;
  recommendationType: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
  evidenceLevel?: string;
  source?: string;
  acceptedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RecommendationPriority = 'low' | 'medium' | 'high';
export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'implemented';

export interface RecommendationFilter {
  patientId?: string;
  recommendationType?: string;
  priority?: RecommendationPriority;
  status?: RecommendationStatus;
}

export function filterRecommendations(
  recommendations: ClinicalRecommendationEntity[],
  filter: RecommendationFilter,
): ClinicalRecommendationEntity[] {
  return recommendations.filter((r) => {
    if (filter.patientId && r.patientId !== filter.patientId) return false;
    if (filter.recommendationType && r.recommendationType !== filter.recommendationType) return false;
    if (filter.priority && r.priority !== filter.priority) return false;
    if (filter.status && r.status !== filter.status) return false;
    return true;
  });
}

export function getPendingRecommendations(
  recommendations: ClinicalRecommendationEntity[],
): ClinicalRecommendationEntity[] {
  return recommendations.filter((r) => r.status === 'pending');
}

export function getHighPriorityRecommendations(
  recommendations: ClinicalRecommendationEntity[],
): ClinicalRecommendationEntity[] {
  return recommendations.filter((r) => r.priority === 'high' && r.status === 'pending');
}

export function sortByPriority(
  recommendations: ClinicalRecommendationEntity[],
): ClinicalRecommendationEntity[] {
  const priorityOrder: Record<RecommendationPriority, number> = { high: 3, medium: 2, low: 1 };
  return [...recommendations].sort(
    (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
  );
}
