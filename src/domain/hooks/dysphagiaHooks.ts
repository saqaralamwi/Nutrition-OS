import { useState, useEffect, useCallback } from 'react';
import { dysphagiaRepository } from '../repositories/dysphagia-repository';
import {
  DysphagiaAssessment,
  DysphagiaNutritionPlan,
  DysphagiaMonitoring,
} from '../types/dysphagia';

export interface UseDysphagiaAssessment {
  assessment: DysphagiaAssessment | null;
  assessments: DysphagiaAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: DysphagiaAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: DysphagiaAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useDysphagiaAssessment = (patientId: string): UseDysphagiaAssessment => {
  const [assessment, setAssessment] = useState<DysphagiaAssessment | null>(null);
  const [assessments, setAssessments] = useState<DysphagiaAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dysphagiaRepository.listAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: DysphagiaAssessment) => {
    try {
      await dysphagiaRepository.createAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: DysphagiaAssessment) => {
    try {
      await dysphagiaRepository.updateAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await dysphagiaRepository.deleteAssessment(id);
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

export interface UseDysphagiaPlan {
  plan: DysphagiaNutritionPlan | null;
  plans: DysphagiaNutritionPlan[];
  activePlan: DysphagiaNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: DysphagiaNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: DysphagiaNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const useDysphagiaPlan = (patientId: string): UseDysphagiaPlan => {
  const [plan, setPlan] = useState<DysphagiaNutritionPlan | null>(null);
  const [plans, setPlans] = useState<DysphagiaNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<DysphagiaNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dysphagiaRepository.listPlans(patientId);
      const active = await dysphagiaRepository.getActivePlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: DysphagiaNutritionPlan) => {
    try {
      await dysphagiaRepository.createPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: DysphagiaNutritionPlan) => {
    try {
      await dysphagiaRepository.updatePlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await dysphagiaRepository.deletePlan(id);
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

export interface UseDysphagiaMonitoring {
  monitoring: DysphagiaMonitoring | null;
  monitoringList: DysphagiaMonitoring[];
  recentMonitoring: DysphagiaMonitoring[];
  loading: boolean;
  error: string | null;
  createMonitoring: (monitoring: DysphagiaMonitoring) => Promise<void>;
  updateMonitoring: (id: string, monitoring: DysphagiaMonitoring) => Promise<void>;
  deleteMonitoring: (id: string) => Promise<void>;
  refreshMonitoring: () => Promise<void>;
}

export const useDysphagiaMonitoring = (patientId: string): UseDysphagiaMonitoring => {
  const [monitoring, setMonitoring] = useState<DysphagiaMonitoring | null>(null);
  const [monitoringList, setMonitoringList] = useState<DysphagiaMonitoring[]>([]);
  const [recentMonitoring, setRecentMonitoring] = useState<DysphagiaMonitoring[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMonitoring = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dysphagiaRepository.listMonitoring(patientId);
      const recent = await dysphagiaRepository.getRecentMonitoring(patientId, 10);
      setMonitoringList(data);
      setRecentMonitoring(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createMonitoring = useCallback(async (m: DysphagiaMonitoring) => {
    try {
      await dysphagiaRepository.createMonitoring(m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const updateMonitoring = useCallback(async (id: string, m: DysphagiaMonitoring) => {
    try {
      await dysphagiaRepository.updateMonitoring(id, m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const deleteMonitoring = useCallback(async (id: string) => {
    try {
      await dysphagiaRepository.deleteMonitoring(id);
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
