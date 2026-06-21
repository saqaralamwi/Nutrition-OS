import { useState, useEffect, useCallback } from 'react';
import { orthopedicsRepository } from '../repositories/orthopedics-repository';
import {
  OrthopedicAssessment,
  OrthopedicNutritionPlan,
  OrthopedicCondition,
  FractureType,
  SurgeryType,
  RecoveryPhase,
  MobilityLevel,
} from '../types/orthopedics';

export interface UseOrthopedicAssessment {
  assessment: OrthopedicAssessment | null;
  assessments: OrthopedicAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: OrthopedicAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: OrthopedicAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useOrthopedicAssessment = (patientId: string): UseOrthopedicAssessment => {
  const [assessment, setAssessment] = useState<OrthopedicAssessment | null>(null);
  const [assessments, setAssessments] = useState<OrthopedicAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orthopedicsRepository.listAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: OrthopedicAssessment) => {
    try {
      await orthopedicsRepository.createAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: OrthopedicAssessment) => {
    try {
      await orthopedicsRepository.updateAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await orthopedicsRepository.deleteAssessment(id);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  useEffect(() => {
    refreshAssessments();
  }, [refreshAssessments]);

  return {
    assessment,
    assessments,
    loading,
    error,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    refreshAssessments,
  };
};

export interface UseOrthopedicPlan {
  plan: OrthopedicNutritionPlan | null;
  plans: OrthopedicNutritionPlan[];
  activePlan: OrthopedicNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: OrthopedicNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: OrthopedicNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const useOrthopedicPlan = (patientId: string): UseOrthopedicPlan => {
  const [plan, setPlan] = useState<OrthopedicNutritionPlan | null>(null);
  const [plans, setPlans] = useState<OrthopedicNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<OrthopedicNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orthopedicsRepository.listPlans(patientId);
      const active = await orthopedicsRepository.getActivePlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: OrthopedicNutritionPlan) => {
    try {
      await orthopedicsRepository.createPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: OrthopedicNutritionPlan) => {
    try {
      await orthopedicsRepository.updatePlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await orthopedicsRepository.deletePlan(id);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  useEffect(() => {
    refreshPlans();
  }, [refreshPlans]);

  return {
    plan,
    plans,
    activePlan,
    loading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    refreshPlans,
  };
};
