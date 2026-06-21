import { useState, useEffect, useCallback } from 'react';
import { respiratoryRepository } from '../repositories/respiratory-repository';
import {
  RespiratoryAssessment,
  RespiratoryNutritionPlan,
  RespiratoryMonitoring,
} from '../types/respiratory';

export interface UseRespiratoryAssessment {
  assessment: RespiratoryAssessment | null;
  assessments: RespiratoryAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: RespiratoryAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: RespiratoryAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useRespiratoryAssessment = (patientId: string): UseRespiratoryAssessment => {
  const [assessment, setAssessment] = useState<RespiratoryAssessment | null>(null);
  const [assessments, setAssessments] = useState<RespiratoryAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await respiratoryRepository.listAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: RespiratoryAssessment) => {
    try {
      await respiratoryRepository.createAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: RespiratoryAssessment) => {
    try {
      await respiratoryRepository.updateAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await respiratoryRepository.deleteAssessment(id);
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

export interface UseRespiratoryPlan {
  plan: RespiratoryNutritionPlan | null;
  plans: RespiratoryNutritionPlan[];
  activePlan: RespiratoryNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: RespiratoryNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: RespiratoryNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const useRespiratoryPlan = (patientId: string): UseRespiratoryPlan => {
  const [plan, setPlan] = useState<RespiratoryNutritionPlan | null>(null);
  const [plans, setPlans] = useState<RespiratoryNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<RespiratoryNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await respiratoryRepository.listPlans(patientId);
      const active = await respiratoryRepository.getActivePlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: RespiratoryNutritionPlan) => {
    try {
      await respiratoryRepository.createPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: RespiratoryNutritionPlan) => {
    try {
      await respiratoryRepository.updatePlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await respiratoryRepository.deletePlan(id);
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

export interface UseRespiratoryMonitoring {
  monitoring: RespiratoryMonitoring | null;
  monitoringList: RespiratoryMonitoring[];
  recentMonitoring: RespiratoryMonitoring[];
  loading: boolean;
  error: string | null;
  createMonitoring: (monitoring: RespiratoryMonitoring) => Promise<void>;
  updateMonitoring: (id: string, monitoring: RespiratoryMonitoring) => Promise<void>;
  deleteMonitoring: (id: string) => Promise<void>;
  refreshMonitoring: () => Promise<void>;
}

export const useRespiratoryMonitoring = (patientId: string): UseRespiratoryMonitoring => {
  const [monitoring, setMonitoring] = useState<RespiratoryMonitoring | null>(null);
  const [monitoringList, setMonitoringList] = useState<RespiratoryMonitoring[]>([]);
  const [recentMonitoring, setRecentMonitoring] = useState<RespiratoryMonitoring[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMonitoring = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await respiratoryRepository.listMonitoring(patientId);
      const recent = await respiratoryRepository.getRecentMonitoring(patientId, 10);
      setMonitoringList(data);
      setRecentMonitoring(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createMonitoring = useCallback(async (m: RespiratoryMonitoring) => {
    try {
      await respiratoryRepository.createMonitoring(m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const updateMonitoring = useCallback(async (id: string, m: RespiratoryMonitoring) => {
    try {
      await respiratoryRepository.updateMonitoring(id, m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const deleteMonitoring = useCallback(async (id: string) => {
    try {
      await respiratoryRepository.deleteMonitoring(id);
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
