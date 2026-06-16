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
import { PatientRepository } from '../PatientRepository';
import { getDatabase, resetDatabase } from '../../database';
import { CreatePatientInput } from '../../../domain/entities/Patient';

describe('PatientRepository - Concurrency File Numbers', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  test('generateFileNumber - creates counter and increments sequentially', async () => {
    const repo = new PatientRepository();
    const num1 = await repo.generateFileNumber();
    const num2 = await repo.generateFileNumber();
    const num3 = await repo.generateFileNumber();

    const year = new Date().getFullYear();
    expect(num1).toBe(`CN-${year}-00001`);
    expect(num2).toBe(`CN-${year}-00002`);
    expect(num3).toBe(`CN-${year}-00003`);
  });

  test('create - creates patients with unique sequential file numbers', async () => {
    const repo = new PatientRepository();
    const input1: CreatePatientInput = {
      fullName: 'Patient One',
      age: 30,
      dateOfBirth: '1996-01-01',
      gender: 'male',
      department: 'General Internal Medicine',
      primaryDiagnosis: 'Healthy',
      patientType: 'inpatient',
      status: 'active'
    };

    const input2: CreatePatientInput = {
      fullName: 'Patient Two',
      age: 25,
      dateOfBirth: '2001-01-01',
      gender: 'female',
      department: 'Surgery Ward',
      primaryDiagnosis: 'Healthy',
      patientType: 'outpatient',
      status: 'active'
    };

    const p1 = await repo.create(input1);
    const p2 = await repo.create(input2);

    const year = new Date().getFullYear();
    expect(p1.fileNumber).toBe(`CN-${year}-00001`);
    expect(p2.fileNumber).toBe(`CN-${year}-00002`);
  });

  test('create - concurrent creations do not generate duplicate file numbers', async () => {
    const repo = new PatientRepository();
    const input: CreatePatientInput = {
      fullName: 'Concurrent Patient',
      age: 40,
      dateOfBirth: '1986-01-01',
      gender: 'male',
      department: 'ICU',
      primaryDiagnosis: 'Critical',
      patientType: 'inpatient',
      status: 'active'
    };

    // Simulate 10 concurrent requests
    const promises = Array.from({ length: 10 }).map(() => repo.create(input));
    const patients = await Promise.all(promises);

    const fileNumbers = patients.map(p => p.fileNumber);
    const uniqueFileNumbers = new Set(fileNumbers);

    // Assert that we have exactly 10 unique file numbers
    expect(fileNumbers.length).toBe(10);
    expect(uniqueFileNumbers.size).toBe(10);

    // Verify they are sequential
    const year = new Date().getFullYear();
    const expectedNumbers = Array.from({ length: 10 }).map((_, i) => {
      const padded = String(i + 1).padStart(5, '0');
      return `CN-${year}-${padded}`;
    });

    expect(fileNumbers.sort()).toEqual(expectedNumbers.sort());
  });
});
