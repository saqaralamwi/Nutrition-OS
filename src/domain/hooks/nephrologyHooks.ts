import { useState, useEffect, useCallback } from 'react';
import { nephrologyRepository } from '../repositories/nephrology-repository';
import {
  NephrologyAssessment,
  NephrologyNutritionPlan,
  NephrologyMonitoring,
} from '../types/nephrology';

export interface UseNephrologyAssessment {
  assessment: NephrologyAssessment | null;
  assessments: NephrologyAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: NephrologyAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: NephrologyAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useNephrologyAssessment = (patientId: string): UseNephrologyAssessment => {
  const [assessment, setAssessment] = useState<NephrologyAssessment | null>(null);
  const [assessments, setAssessments] = useState<NephrologyAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await nephrologyRepository.listAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: NephrologyAssessment) => {
    try {
      await nephrologyRepository.createAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: NephrologyAssessment) => {
    try {
      await nephrologyRepository.updateAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await nephrologyRepository.deleteAssessment(id);
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

export interface UseNephrologyPlan {
  plan: NephrologyNutritionPlan | null;
  plans: NephrologyNutritionPlan[];
  activePlan: NephrologyNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: NephrologyNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: NephrologyNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const useNephrologyPlan = (patientId: string): UseNephrologyPlan => {
  const [plan, setPlan] = useState<NephrologyNutritionPlan | null>(null);
  const [plans, setPlans] = useState<NephrologyNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<NephrologyNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await nephrologyRepository.listPlans(patientId);
      const active = await nephrologyRepository.getActivePlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: NephrologyNutritionPlan) => {
    try {
      await nephrologyRepository.createPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: NephrologyNutritionPlan) => {
    try {
      await nephrologyRepository.updatePlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await nephrologyRepository.deletePlan(id);
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

export interface UseNephrologyMonitoring {
  monitoring: NephrologyMonitoring | null;
  monitoringList: NephrologyMonitoring[];
  recentMonitoring: NephrologyMonitoring[];
  loading: boolean;
  error: string | null;
  createMonitoring: (monitoring: NephrologyMonitoring) => Promise<void>;
  updateMonitoring: (id: string, monitoring: NephrologyMonitoring) => Promise<void>;
  deleteMonitoring: (id: string) => Promise<void>;
  refreshMonitoring: () => Promise<void>;
}

export const useNephrologyMonitoring = (patientId: string): UseNephrologyMonitoring => {
  const [monitoring, setMonitoring] = useState<NephrologyMonitoring | null>(null);
  const [monitoringList, setMonitoringList] = useState<NephrologyMonitoring[]>([]);
  const [recentMonitoring, setRecentMonitoring] = useState<NephrologyMonitoring[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMonitoring = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await nephrologyRepository.listMonitoring(patientId);
      const recent = await nephrologyRepository.getRecentMonitoring(patientId, 10);
      setMonitoringList(data);
      setRecentMonitoring(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createMonitoring = useCallback(async (m: NephrologyMonitoring) => {
    try {
      await nephrologyRepository.createMonitoring(m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const updateMonitoring = useCallback(async (id: string, m: NephrologyMonitoring) => {
    try {
      await nephrologyRepository.updateMonitoring(id, m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const deleteMonitoring = useCallback(async (id: string) => {
    try {
      await nephrologyRepository.deleteMonitoring(id);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  useEffect(() => {
    refreshMonitoring();
  }, [refreshMonitoring]);

  return {
    monitoring,
    monitoringList,
    recentMonitoring,
    loading,
    error,
    createMonitoring,
    updateMonitoring,
    deleteMonitoring,
    refreshMonitoring,
  };
};
