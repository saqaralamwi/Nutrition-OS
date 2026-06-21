import { useState, useEffect, useCallback } from 'react';
import { diabetesRepository } from '../repositories/diabetes-repository';
import {
  DiabetesAssessment,
  DiabetesNutritionPlan,
  DiabetesMonitoring,
  DiabetesType,
  DiabetesSeverity,
} from '../types/diabetes';

export interface UseDiabetesAssessment {
  assessment: DiabetesAssessment | null;
  assessments: DiabetesAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: DiabetesAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: DiabetesAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useDiabetesAssessment = (patientId: string): UseDiabetesAssessment => {
  const [assessment, setAssessment] = useState<DiabetesAssessment | null>(null);
  const [assessments, setAssessments] = useState<DiabetesAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await diabetesRepository.listAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: DiabetesAssessment) => {
    try {
      await diabetesRepository.createAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: DiabetesAssessment) => {
    try {
      await diabetesRepository.updateAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await diabetesRepository.deleteAssessment(id);
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

export interface UseDiabetesPlan {
  plan: DiabetesNutritionPlan | null;
  plans: DiabetesNutritionPlan[];
  activePlan: DiabetesNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: DiabetesNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: DiabetesNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const useDiabetesPlan = (patientId: string): UseDiabetesPlan => {
  const [plan, setPlan] = useState<DiabetesNutritionPlan | null>(null);
  const [plans, setPlans] = useState<DiabetesNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<DiabetesNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await diabetesRepository.listPlans(patientId);
      const active = await diabetesRepository.getActivePlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: DiabetesNutritionPlan) => {
    try {
      await diabetesRepository.createPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: DiabetesNutritionPlan) => {
    try {
      await diabetesRepository.updatePlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await diabetesRepository.deletePlan(id);
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

export interface UseDiabetesMonitoring {
  monitoring: DiabetesMonitoring | null;
  monitoringList: DiabetesMonitoring[];
  recentMonitoring: DiabetesMonitoring[];
  loading: boolean;
  error: string | null;
  createMonitoring: (monitoring: DiabetesMonitoring) => Promise<void>;
  updateMonitoring: (id: string, monitoring: DiabetesMonitoring) => Promise<void>;
  deleteMonitoring: (id: string) => Promise<void>;
  refreshMonitoring: () => Promise<void>;
}

export const useDiabetesMonitoring = (patientId: string): UseDiabetesMonitoring => {
  const [monitoring, setMonitoring] = useState<DiabetesMonitoring | null>(null);
  const [monitoringList, setMonitoringList] = useState<DiabetesMonitoring[]>([]);
  const [recentMonitoring, setRecentMonitoring] = useState<DiabetesMonitoring[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMonitoring = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await diabetesRepository.listMonitoring(patientId);
      const recent = await diabetesRepository.getRecentMonitoring(patientId, 10);
      setMonitoringList(data);
      setRecentMonitoring(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createMonitoring = useCallback(async (m: DiabetesMonitoring) => {
    try {
      await diabetesRepository.createMonitoring(m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const updateMonitoring = useCallback(async (id: string, m: DiabetesMonitoring) => {
    try {
      await diabetesRepository.updateMonitoring(id, m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const deleteMonitoring = useCallback(async (id: string) => {
    try {
      await diabetesRepository.deleteMonitoring(id);
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
