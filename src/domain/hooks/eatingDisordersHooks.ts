import { useState, useEffect, useCallback } from 'react';
import { eatingDisordersRepository } from '../repositories/eating-disorders-repository';
import {
  AnorexiaAssessment,
  AnorexiaNutritionPlan,
  BulimiaAssessment,
  BulimiaNutritionPlan,
  EatingDisorderType,
  EatingDisorderSeverity,
} from '../types/eating-disorders';

export interface UseAnorexiaAssessment {
  assessment: AnorexiaAssessment | null;
  assessments: AnorexiaAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: AnorexiaAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: AnorexiaAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useAnorexiaAssessment = (patientId: string): UseAnorexiaAssessment => {
  const [assessment, setAssessment] = useState<AnorexiaAssessment | null>(null);
  const [assessments, setAssessments] = useState<AnorexiaAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eatingDisordersRepository.listAnorexiaAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: AnorexiaAssessment) => {
    try {
      await eatingDisordersRepository.createAnorexiaAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: AnorexiaAssessment) => {
    try {
      await eatingDisordersRepository.updateAnorexiaAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await eatingDisordersRepository.deleteAnorexiaAssessment(id);
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

export interface UseAnorexiaPlan {
  plan: AnorexiaNutritionPlan | null;
  plans: AnorexiaNutritionPlan[];
  activePlan: AnorexiaNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: AnorexiaNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: AnorexiaNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const useAnorexiaPlan = (patientId: string): UseAnorexiaPlan => {
  const [plan, setPlan] = useState<AnorexiaNutritionPlan | null>(null);
  const [plans, setPlans] = useState<AnorexiaNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<AnorexiaNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eatingDisordersRepository.listAnorexiaPlans(patientId);
      const active = await eatingDisordersRepository.getActiveAnorexiaPlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: AnorexiaNutritionPlan) => {
    try {
      await eatingDisordersRepository.createAnorexiaPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: AnorexiaNutritionPlan) => {
    try {
      await eatingDisordersRepository.updateAnorexiaPlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await eatingDisordersRepository.deleteAnorexiaPlan(id);
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

export interface UseBulimiaAssessment {
  assessment: BulimiaAssessment | null;
  assessments: BulimiaAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: BulimiaAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: BulimiaAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useBulimiaAssessment = (patientId: string): UseBulimiaAssessment => {
  const [assessment, setAssessment] = useState<BulimiaAssessment | null>(null);
  const [assessments, setAssessments] = useState<BulimiaAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eatingDisordersRepository.listBulimiaAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: BulimiaAssessment) => {
    try {
      await eatingDisordersRepository.createBulimiaAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: BulimiaAssessment) => {
    try {
      await eatingDisordersRepository.updateBulimiaAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await eatingDisordersRepository.deleteBulimiaAssessment(id);
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

export interface UseBulimiaPlan {
  plan: BulimiaNutritionPlan | null;
  plans: BulimiaNutritionPlan[];
  activePlan: BulimiaNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: BulimiaNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: BulimiaNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const useBulimiaPlan = (patientId: string): UseBulimiaPlan => {
  const [plan, setPlan] = useState<BulimiaNutritionPlan | null>(null);
  const [plans, setPlans] = useState<BulimiaNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<BulimiaNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eatingDisordersRepository.listBulimiaPlans(patientId);
      const active = await eatingDisordersRepository.getActiveBulimiaPlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: BulimiaNutritionPlan) => {
    try {
      await eatingDisordersRepository.createBulimiaPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: BulimiaNutritionPlan) => {
    try {
      await eatingDisordersRepository.updateBulimiaPlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await eatingDisordersRepository.deleteBulimiaPlan(id);
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
