import { useState, useEffect, useCallback } from 'react';
import { burnsRepository } from '../repositories/burns-repository';
import {
  BurnsAssessment,
  BurnsNutritionPlan,
  BurnsMonitoring,
} from '../types/burns';

export interface UseBurnsAssessment {
  assessment: BurnsAssessment | null;
  assessments: BurnsAssessment[];
  loading: boolean;
  error: string | null;
  createAssessment: (assessment: BurnsAssessment) => Promise<void>;
  updateAssessment: (id: string, assessment: BurnsAssessment) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  refreshAssessments: () => Promise<void>;
}

export const useBurnsAssessment = (patientId: string): UseBurnsAssessment => {
  const [assessment, setAssessment] = useState<BurnsAssessment | null>(null);
  const [assessments, setAssessments] = useState<BurnsAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await burnsRepository.listAssessments(patientId);
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createAssessment = useCallback(async (a: BurnsAssessment) => {
    try {
      await burnsRepository.createAssessment(a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const updateAssessment = useCallback(async (id: string, a: BurnsAssessment) => {
    try {
      await burnsRepository.updateAssessment(id, a);
      await refreshAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshAssessments]);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await burnsRepository.deleteAssessment(id);
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

export interface UseBurnsPlan {
  plan: BurnsNutritionPlan | null;
  plans: BurnsNutritionPlan[];
  activePlan: BurnsNutritionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: BurnsNutritionPlan) => Promise<void>;
  updatePlan: (id: string, plan: BurnsNutritionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
}

export const useBurnsPlan = (patientId: string): UseBurnsPlan => {
  const [plan, setPlan] = useState<BurnsNutritionPlan | null>(null);
  const [plans, setPlans] = useState<BurnsNutritionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<BurnsNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await burnsRepository.listPlans(patientId);
      const active = await burnsRepository.getActivePlan(patientId);
      setPlans(data);
      setActivePlan(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createPlan = useCallback(async (p: BurnsNutritionPlan) => {
    try {
      await burnsRepository.createPlan(p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const updatePlan = useCallback(async (id: string, p: BurnsNutritionPlan) => {
    try {
      await burnsRepository.updatePlan(id, p);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await burnsRepository.deletePlan(id);
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

export interface UseBurnsMonitoring {
  monitoring: BurnsMonitoring | null;
  monitoringList: BurnsMonitoring[];
  recentMonitoring: BurnsMonitoring[];
  loading: boolean;
  error: string | null;
  createMonitoring: (monitoring: BurnsMonitoring) => Promise<void>;
  updateMonitoring: (id: string, monitoring: BurnsMonitoring) => Promise<void>;
  deleteMonitoring: (id: string) => Promise<void>;
  refreshMonitoring: () => Promise<void>;
}

export const useBurnsMonitoring = (patientId: string): UseBurnsMonitoring => {
  const [monitoring, setMonitoring] = useState<BurnsMonitoring | null>(null);
  const [monitoringList, setMonitoringList] = useState<BurnsMonitoring[]>([]);
  const [recentMonitoring, setRecentMonitoring] = useState<BurnsMonitoring[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMonitoring = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await burnsRepository.listMonitoring(patientId);
      const recent = await burnsRepository.getRecentMonitoring(patientId, 10);
      setMonitoringList(data);
      setRecentMonitoring(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const createMonitoring = useCallback(async (m: BurnsMonitoring) => {
    try {
      await burnsRepository.createMonitoring(m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const updateMonitoring = useCallback(async (id: string, m: BurnsMonitoring) => {
    try {
      await burnsRepository.updateMonitoring(id, m);
      await refreshMonitoring();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshMonitoring]);

  const deleteMonitoring = useCallback(async (id: string) => {
    try {
      await burnsRepository.deleteMonitoring(id);
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
