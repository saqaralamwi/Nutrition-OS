import { vi } from 'vitest';

// Force window mock, __DEV__, and ExpoGlobal to be hoisted before all imports
vi.hoisted(() => {
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = {
      document: {}
    };
  }
  (globalThis as any).__DEV__ = true;
  (globalThis as any).__SKIP_SEEDING__ = true;
  (globalThis as any).ExpoGlobal = {
    EventEmitter: class MockEventEmitter {
      addListener() { return { remove: () => {} }; }
      emit() {}
      removeAllListeners() {}
    }
  };
});

// Mock expo-secure-store to prevent loading native expo modules in Node
vi.mock('expo-secure-store', () => {
  return {
    getItemAsync: async () => null,
    setItemAsync: async () => {},
    deleteItemAsync: async () => {},
  };
});

// Mock expo-local-authentication to prevent loading native expo modules in Node
vi.mock('expo-local-authentication', () => {
  return {
    hasHardwareAsync: async () => false,
    isEnrolledAsync: async () => false,
    authenticateAsync: async () => ({ success: false }),
  };
});

// Mock expo-file-system to prevent loading native expo modules in Node
vi.mock('expo-file-system', () => {
  return {
    documentDirectory: 'mock-dir/',
    makeDirectoryAsync: async () => {},
    downloadAsync: async () => ({ uri: 'mock-uri' }),
    uploadAsync: async () => ({ status: 200, body: '{}' }),
  };
});

// Mock react-native to prevent Flow parsing issues in Node test environment
vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  StyleSheet: { create: (s: any) => s },
  View: () => null,
  Text: () => null,
}));

// Mock SQLite adapter to prevent Vitest from loading better-sqlite3
vi.mock('@nozbe/watermelondb/adapters/sqlite', () => {
  return {
    default: class MockSQLiteAdapter {}
  };
});

// Mock index.native to prevent transpilation of SQLite dependency in Node
vi.mock('../../database/index.native', () => {
  return {
    getDatabase: () => {},
    getDatabaseInstance: () => null,
    resetDatabase: () => {},
  };
});

// Mock LokiJSAdapter to run in pure memory mode under Node.js (disable IndexedDB)
vi.mock('@nozbe/watermelondb/adapters/lokijs', async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    default: class MockLokiJSAdapter extends original.default {
      constructor(options: any) {
        super({
          ...options,
          useIncrementalIndexedDB: false,
          useWebWorker: false,
        });
      }
    }
  };
});

import { describe, test, expect, beforeEach } from 'vitest';
import { getDatabase, resetDatabase } from '../../database';
import { Q } from '@nozbe/watermelondb';
import CalculationModel from '../../models/Calculation';
import {
  CalculationRepository,
  createCalculation,
  queryCalculationsByWeight,
  queryCalculationsByTEE,
  aggregateCalculations,
  getLatestCalculation
} from '../CalculationRepository';

describe('CalculationRepository - JSON Blindspots Removal', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  test('createCalculation - creates calculation with correct flat columns and JSON string', async () => {
    const calc = await createCalculation({
      patient_id: 'patient-123',
      calculation_type: 'total_energy',
      input_weight_kg: 85.5,
      input_height_cm: 180,
      input_age: 45,
      input_gender: 'male',
      input_bmi: 26.4,
      input_activity_factor: 1.2,
      input_stress_factor: 1.1,
      result_tee: 2200,
      result_ree: 1800,
      result_protein_g: 110,
      result_carbs_g: 300,
      result_fat_g: 70,
      result_fluid_ml: 2500,
      result_calories: 2200,
      created_by: 'dr_ahmed'
    });

    expect(calc.patientId).toBe('patient-123');
    expect(calc.calculationType).toBe('total_energy');
    expect(calc.inputWeightKg).toBe(85.5);
    expect(calc.inputHeightCm).toBe(180);
    expect(calc.inputAge).toBe(45);
    expect(calc.inputGender).toBe('male');
    expect(calc.inputBmi).toBe(26.4);
    expect(calc.resultTee).toBe(2200);
    expect(calc.resultProteinG).toBe(110);
    expect(calc.proteinPerKg).toBeCloseTo(1.29, 2); // 110 / 85.5
    expect(calc.caloriesPerKg).toBeCloseTo(25.73, 2); // 2200 / 85.5

    const parsedInputs = JSON.parse(calc.inputValues);
    expect(parsedInputs.weightKg).toBe(85.5);
    expect(parsedInputs.gender).toBe('male');
  });

  test('queryCalculationsByWeight - filters calculations by weight properly', async () => {
    await createCalculation({
      patient_id: 'p1',
      calculation_type: 'total_energy',
      input_weight_kg: 95.0,
      input_height_cm: 180,
      input_age: 30,
      input_gender: 'male',
      result_tee: 2500,
      result_protein_g: 120,
      result_carbs_g: 350,
      result_fat_g: 80,
      result_calories: 2500,
      created_by: 'test'
    });

    await createCalculation({
      patient_id: 'p2',
      calculation_type: 'total_energy',
      input_weight_kg: 60.0,
      input_height_cm: 165,
      input_age: 28,
      input_gender: 'female',
      result_tee: 1600,
      result_protein_g: 80,
      result_carbs_g: 220,
      result_fat_g: 50,
      result_calories: 1600,
      created_by: 'test'
    });

    const heavyCalcs = await queryCalculationsByWeight(80);
    expect(heavyCalcs.length).toBe(1);
    expect(heavyCalcs[0].patientId).toBe('p1');
    expect(heavyCalcs[0].inputWeightKg).toBe(95);

    const allCalcs = await queryCalculationsByWeight(50);
    expect(allCalcs.length).toBe(2);
  });

  test('queryCalculationsByTEE - filters calculations by TEE properly', async () => {
    await createCalculation({
      patient_id: 'p1',
      calculation_type: 'total_energy',
      input_weight_kg: 95.0,
      input_height_cm: 180,
      input_age: 30,
      input_gender: 'male',
      result_tee: 2500,
      result_protein_g: 120,
      result_carbs_g: 350,
      result_fat_g: 80,
      result_calories: 2500,
      created_by: 'test'
    });

    await createCalculation({
      patient_id: 'p2',
      calculation_type: 'total_energy',
      input_weight_kg: 60.0,
      input_height_cm: 165,
      input_age: 28,
      input_gender: 'female',
      result_tee: 1400,
      result_protein_g: 80,
      result_carbs_g: 220,
      result_fat_g: 50,
      result_calories: 1400,
      created_by: 'test'
    });

    const lowEnergyCalcs = await queryCalculationsByTEE(1500);
    expect(lowEnergyCalcs.length).toBe(1);
    expect(lowEnergyCalcs[0].patientId).toBe('p2');
    expect(lowEnergyCalcs[0].resultTee).toBe(1400);
  });

  test('aggregateCalculations - groups and aggregates TEE and Protein metrics by gender', async () => {
    await createCalculation({
      patient_id: 'p1',
      calculation_type: 'total_energy',
      input_weight_kg: 100,
      input_height_cm: 180,
      input_age: 40,
      input_gender: 'male',
      result_tee: 2000,
      result_protein_g: 150,
      result_carbs_g: 200,
      result_fat_g: 50,
      result_calories: 2000,
      created_by: 'test'
    });

    await createCalculation({
      patient_id: 'p2',
      calculation_type: 'total_energy',
      input_weight_kg: 80,
      input_height_cm: 180,
      input_age: 35,
      input_gender: 'male',
      result_tee: 1800,
      result_protein_g: 120,
      result_carbs_g: 200,
      result_fat_g: 50,
      result_calories: 1800,
      created_by: 'test'
    });

    await createCalculation({
      patient_id: 'p3',
      calculation_type: 'total_energy',
      input_weight_kg: 60,
      input_height_cm: 160,
      input_age: 30,
      input_gender: 'female',
      result_tee: 1200,
      result_protein_g: 90,
      result_carbs_g: 150,
      result_fat_g: 40,
      result_calories: 1200,
      created_by: 'test'
    });

    const agg = await aggregateCalculations('total_energy', 'input_gender');
    expect(agg.male).toBeDefined();
    expect(agg.male.count).toBe(2);
    expect(agg.male.avgTee).toBe(1900); // (2000 + 1800) / 2
    expect(agg.male.avgProtein).toBe(135); // (150 + 120) / 2

    expect(agg.female).toBeDefined();
    expect(agg.female.count).toBe(1);
    expect(agg.female.avgTee).toBe(1200);
    expect(agg.female.avgProtein).toBe(90);
  });

  test('getLatestCalculation - retrieves latest entry for a patient', async () => {
    const repo = new CalculationRepository();

    await createCalculation({
      patient_id: 'patient-1',
      calculation_type: 'total_energy',
      input_weight_kg: 70,
      input_height_cm: 170,
      input_age: 50,
      input_gender: 'female',
      result_tee: 1500,
      result_protein_g: 70,
      result_carbs_g: 200,
      result_fat_g: 50,
      result_calories: 1500,
      created_by: 'dr_1'
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const latest = await createCalculation({
      patient_id: 'patient-1',
      calculation_type: 'total_energy',
      input_weight_kg: 72,
      input_height_cm: 170,
      input_age: 50,
      input_gender: 'female',
      result_tee: 1600,
      result_protein_g: 75,
      result_carbs_g: 210,
      result_fat_g: 52,
      result_calories: 1600,
      created_by: 'dr_2'
    });

    const result = await getLatestCalculation('patient-1', 'total_energy');
    expect(result).not.toBeNull();
    expect(result!.id).toBe(latest.id);
    expect(result!.inputWeightKg).toBe(72);
  });
});
