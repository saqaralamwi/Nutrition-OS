import { useState, useEffect, useCallback } from 'react';
import { gastroOncologyRepository } from '../repositories/gastro-oncology-repository';
import {
  GIAssessment,
  GastroOncologyAssessment,
  GastroOncologyNutritionPlan,
  CancerType,
  CancerStage,
  CachexiaSeverity,
} from '../types/gastro-oncology';

export interface UseGIAssessment {
  assessment: GIAssessment | null;
  assessments: GIAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: GIAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: GIAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useGIAssessment = (patientId: string): UseGIAssessment => {
  const [assessment, setAssessment] = useState<GIAssessment | null>(null);
  const [assessments, setAssessments] = useState<GIAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gastroOncologyRepository.listGIAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: GIAssessment) => {
    try {
      await gastroOncologyRepository.createGIAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: GIAssessment) => {
    try {
      await gastroOncologyRepository.updateGIAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await gastroOncologyRepository.deleteGIAssessment(id);
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

export interface UseGastroOncologyAssessment {
  assessment: GastroOncologyAssessment | null;
  assessments: GastroOncologyAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: GastroOncologyAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: GastroOncologyAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useGastroOncologyAssessment = (patientId: string): UseGastroOncologyAssessment => {
  const [assessment, setAssessment] = useState<GastroOncologyAssessment | null>(null);
  const [assessments, setAssessments] = useState<GastroOncologyAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gastroOncologyRepository.listGastroOncologyAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: GastroOncologyAssessment) => {
    try {
      await gastroOncologyRepository.createGastroOncologyAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: GastroOncologyAssessment) => {
    try {
      await gastroOncologyRepository.updateGastroOncologyAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await gastroOncologyRepository.deleteGastroOncologyAssessment(id);
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

export interface UseGastroOncologyPlan {
  plan: GastroOncologyNutritionPlan | null;
  plans: GastroOncologyNutritionPlan[];
  activePlan: GastroOncologyNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: GastroOncologyNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: GastroOncologyNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const useGastroOncologyPlan = (patientId: string): UseGastroOncologyPlan => {
  const [plan, setPlan] = useState<GastroOncologyNutritionPlan | null>(null);
  const [plans, setPlans] = useState<GastroOncologyNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<GastroOncologyNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gastroOncologyRepository.listPlans(patientId);
      const active = await gastroOncologyRepository.getActivePlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: GastroOncologyNutritionPlan) => {
    try {
      await gastroOncologyRepository.createPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: GastroOncologyNutritionPlan) => {
    try {
      await gastroOncologyRepository.updatePlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await gastroOncologyRepository.deletePlan(id);
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
