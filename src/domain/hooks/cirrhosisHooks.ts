import { useState, useEffect, useCallback } from 'react';
import { cirrhosisRepository } from '../repositories/cirrhosis-repository';
import {
  CirrhosisAssessment,
  CirrhosisNutritionPlan,
  CirrhosisMonitoring,
} from '../types/cirrhosis';

export interface UseCirrhosisAssessment {
  assessment: CirrhosisAssessment | null;
  assessments: CirrhosisAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: CirrhosisAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: CirrhosisAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useCirrhosisAssessment = (patientId: string): UseCirrhosisAssessment => {
  const [assessment, setAssessment] = useState<CirrhosisAssessment | null>(null);
  const [assessments, setAssessments] = useState<CirrhosisAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cirrhosisRepository.listAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: CirrhosisAssessment) => {
    try {
      await cirrhosisRepository.createAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: CirrhosisAssessment) => {
    try {
      await cirrhosisRepository.updateAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await cirrhosisRepository.deleteAssessment(id);
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

export interface UseCirrhosisPlan {
  plan: CirrhosisNutritionPlan | null;
  plans: CirrhosisNutritionPlan[];
  activePlan: CirrhosisNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: CirrhosisNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: CirrhosisNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const useCirrhosisPlan = (patientId: string): UseCirrhosisPlan => {
  const [plan, setPlan] = useState<CirrhosisNutritionPlan | null>(null);
  const [plans, setPlans] = useState<CirrhosisNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<CirrhosisNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cirrhosisRepository.listPlans(patientId);
      const active = await cirrhosisRepository.getActivePlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: CirrhosisNutritionPlan) => {
    try {
      await cirrhosisRepository.createPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: CirrhosisNutritionPlan) => {
    try {
      await cirrhosisRepository.updatePlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await cirrhosisRepository.deletePlan(id);
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

export interface UseCirrhosisMonitoring {
  monitoring: CirrhosisMonitoring | null;
  monitoringList: CirrhosisMonitoring[];
  recentMonitoring: CirrhosisMonitoring[];
  loading: boolean;
  error: string | null;
  createMonitoring: (monitoring: CirrhosisMonitoring) => Promise<void>;
  updateMonitoring: (id: string, monitoring: CirrhosisMonitoring) => Promise<void>;
  deleteMonitoring: (id: string) => Promise<void>;
  refreshMonitoring: () => Promise<void>;
}

export const useCirrhosisMonitoring = (patientId: string): UseCirrhosisMonitoring => {
  const [monitoring, setMonitoring] = useState<CirrhosisMonitoring | null>(null);
  const [monitoringList, setMonitoringList] = useState<CirrhosisMonitoring[]>([]);
  const [recentMonitoring, setRecentMonitoring] = useState<CirrhosisMonitoring[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMonitoring = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cirrhosisRepository.listMonitoring(patientId);
      const recent = await cirrhosisRepository.getRecentMonitoring(patientId, 10);
      setMonitoringList(data);
      setRecentMonitoring(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createMonitoring = useCallback(async (m: CirrhosisMonitoring) => {
    try {
      await cirrhosisRepository.createMonitoring(m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const updateMonitoring = useCallback(async (id: string, m: CirrhosisMonitoring) => {
    try {
      await cirrhosisRepository.updateMonitoring(id, m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const deleteMonitoring = useCallback(async (id: string) => {
    try {
      await cirrhosisRepository.deleteMonitoring(id);
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
