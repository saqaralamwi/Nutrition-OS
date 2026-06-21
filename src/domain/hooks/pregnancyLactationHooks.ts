import { useState, useEffect, useCallback } from 'react';
import { pregnancyLactationRepository } from '../repositories/pregnancy-lactation-repository';
import {
  PregnancyAssessment,
  PregnancyNutritionPlan,
  LactationAssessment,
  LactationNutritionPlan,
} from '../types/pregnancy-lactation';

export interface UsePregnancyAssessment {
  assessment: PregnancyAssessment | null;
  assessments: PregnancyAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: PregnancyAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: PregnancyAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const usePregnancyAssessment = (patientId: string): UsePregnancyAssessment => {
  const [assessment, setAssessment] = useState<PregnancyAssessment | null>(null);
  const [assessments, setAssessments] = useState<PregnancyAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pregnancyLactationRepository.listPregnancyAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: PregnancyAssessment) => {
    try {
      await pregnancyLactationRepository.createPregnancyAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: PregnancyAssessment) => {
    try {
      await pregnancyLactationRepository.updatePregnancyAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await pregnancyLactationRepository.deletePregnancyAssessment(id);
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

export interface UsePregnancyPlan {
  plan: PregnancyNutritionPlan | null;
  plans: PregnancyNutritionPlan[];
  activePlan: PregnancyNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: PregnancyNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: PregnancyNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const usePregnancyPlan = (patientId: string): UsePregnancyPlan => {
  const [plan, setPlan] = useState<PregnancyNutritionPlan | null>(null);
  const [plans, setPlans] = useState<PregnancyNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<PregnancyNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pregnancyLactationRepository.listPregnancyPlans(patientId);
      const active = await pregnancyLactationRepository.getActivePregnancyPlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: PregnancyNutritionPlan) => {
    try {
      await pregnancyLactationRepository.createPregnancyPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: PregnancyNutritionPlan) => {
    try {
      await pregnancyLactationRepository.updatePregnancyPlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await pregnancyLactationRepository.deletePregnancyPlan(id);
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

export interface UseLactationAssessment {
  assessment: LactationAssessment | null;
  assessments: LactationAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: LactationAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: LactationAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useLactationAssessment = (patientId: string): UseLactationAssessment => {
  const [assessment, setAssessment] = useState<LactationAssessment | null>(null);
  const [assessments, setAssessments] = useState<LactationAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pregnancyLactationRepository.listLactationAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: LactationAssessment) => {
    try {
      await pregnancyLactationRepository.createLactationAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: LactationAssessment) => {
    try {
      await pregnancyLactationRepository.updateLactationAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await pregnancyLactationRepository.deleteLactationAssessment(id);
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

export interface UseLactationPlan {
  plan: LactationNutritionPlan | null;
  plans: LactationNutritionPlan[];
  activePlan: LactationNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: LactationNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: LactationNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const useLactationPlan = (patientId: string): UseLactationPlan => {
  const [plan, setPlan] = useState<LactationNutritionPlan | null>(null);
  const [plans, setPlans] = useState<LactationNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<LactationNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pregnancyLactationRepository.listLactationPlans(patientId);
      const active = await pregnancyLactationRepository.getActiveLactationPlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: LactationNutritionPlan) => {
    try {
      await pregnancyLactationRepository.createLactationPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: LactationNutritionPlan) => {
    try {
      await pregnancyLactationRepository.updateLactationPlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await pregnancyLactationRepository.deleteLactationPlan(id);
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
