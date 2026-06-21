import { vi, describe, it, expect, beforeEach } from 'vitest';
import { localAIModelManager } from '../domain/ai/LocalAIModelManager';
import { NutritionAIEngine } from '../domain/ai/NutritionAIEngine';
import { RiskPredictionAIEngine } from '../domain/ai/RiskPredictionAIEngine';
import { Patient } from '../domain/entities/Patient';

// Mock TensorFlow
vi.mock('@tensorflow/tfjs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tensorflow/tfjs')>();
  return {
    ...actual,
    setBackend: vi.fn(),
    registerBackend: vi.fn(),
    getBackend: vi.fn(() => 'react-native'),
    removeBackend: vi.fn(),
    loadGraphModel: vi.fn(async () => ({
      inputs: [{ shape: [1, 7] }],
      outputs: [{ shape: [1, 3] }],
      predict: vi.fn(() => ({
        data: async () => new Float32Array([0.8]),
        dispose: vi.fn(),
        shape: [1, 3],
      })),
      dispose: vi.fn(),
    })),
    tensor2d: vi.fn((data, shape) => ({
      shape,
      dispose: vi.fn(),
    })),
  };
});

vi.mock('@tensorflow/tfjs-react-native', () => {
  return {
    TensorFlowBackend: class {},
  };
});

vi.mock('@react-native-async-storage/async-storage', () => {
  return {
    default: {
      getItem: vi.fn(async () => null),
      setItem: vi.fn(async () => {}),
    },
  };
});

describe('Offline-First AI Features Tests', () => {
  const mockPatient: Patient = {
    id: 'patient-123',
    fileNumber: 'FN-123',
    fullName: 'John Doe',
    age: 45,
    dateOfBirth: '1981-01-01',
    gender: 'male',
    nationalId: null,
    nationality: null,
    phoneNumber: null,
    department: 'ICU',
    bedNumber: '12',
    admissionDate: new Date().toISOString(),
    referringPhysician: null,
    primaryDiagnosis: 'Malnutrition risk',
    patientType: 'inpatient',
    status: 'active',
    notes: 'History of type 2 diabetes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockAssessment = {
    bmi: 22.5,
    bmr: 1600,
    activityLevel: 1.3,
    proteinPerKg: 1.2,
    fluidIntake: 2000,
    proteinIntake: 0.9,
    calorieIntake: 1800,
    urineOutput: 1.0,
    glucoseLevel: 110,
  };

  const mockHistory: any[] = [];

  beforeEach(async () => {
    // Reset/cleanup model manager state before each test
    await localAIModelManager.cleanup();
  });

  describe('LocalAIModelManager', () => {
    it('should initialize successfully', async () => {
      expect(localAIModelManager.isInitialized()).toBe(false);
      await localAIModelManager.initialize();
      expect(localAIModelManager.isInitialized()).toBe(true);
    });

    it('should load a model and track its metadata', async () => {
      await localAIModelManager.initialize();
      
      const modelName = 'nutrition';
      const modelPath = './models/nutrition_model.tflite';
      
      const model = await localAIModelManager.loadModel(modelName, modelPath);
      
      expect(model.name).toBe(modelName);
      expect(model.loaded).toBe(true);
      expect(localAIModelManager.isModelLoaded(modelName)).toBe(true);
      expect(localAIModelManager.getLoadedModels()).toContain(modelName);
      
      const metadata = localAIModelManager.getModelMetadata(modelName);
      expect(metadata).toBeDefined();
      expect(metadata?.path).toBe(modelPath);
    });

    it('should run inference and return an array', async () => {
      await localAIModelManager.initialize();
      await localAIModelManager.loadModel('nutrition', './models/nutrition_model.tflite');
      
      // Creating a mock tensor
      const tf = await import('@tensorflow/tfjs');
      const inputTensor = tf.tensor2d([[0.45, 0.46, 0.68, 1, 0.56, 0.53, 0.52]], [1, 7]);
      
      const output = await localAIModelManager.runInferenceAndGetArray('nutrition', inputTensor);
      expect(output).toBeInstanceOf(Array);
      expect(output[0]).toBeCloseTo(0.8);
    });

    it('should unload models and cleanup correctly', async () => {
      await localAIModelManager.initialize();
      await localAIModelManager.loadModel('nutrition', './models/nutrition_model.tflite');
      
      expect(localAIModelManager.isModelLoaded('nutrition')).toBe(true);
      await localAIModelManager.unloadModel('nutrition');
      expect(localAIModelManager.isModelLoaded('nutrition')).toBe(false);
      
      await localAIModelManager.dispose();
      expect(localAIModelManager.isInitialized()).toBe(false);
    });
  });

  describe('NutritionAIEngine', () => {
    it('should generate recommendations with reasonable values', async () => {
      const recommendations = await NutritionAIEngine.generateRecommendations(
        mockPatient,
        mockAssessment
      );

      expect(recommendations).toHaveLength(3);
      
      const calorieRec = recommendations.find(r => r.recommendationType === 'calorie');
      expect(calorieRec).toBeDefined();
      expect(calorieRec?.value).toBeGreaterThan(0);
      expect(calorieRec?.unit).toBe('kcal/day');
      expect(calorieRec?.confidence).toBeCloseTo(0.8);

      const proteinRec = recommendations.find(r => r.recommendationType === 'protein');
      expect(proteinRec).toBeDefined();
      expect(proteinRec?.unit).toBe('g/day');
      
      const carbsRec = recommendations.find(r => r.recommendationType === 'carbs');
      expect(carbsRec).toBeDefined();
      expect(carbsRec?.unit).toBe('g/day');
    });

    it('should handle patient weight fallback options safely', async () => {
      const patientWithoutWeight = { ...mockPatient };
      const assessmentWithWeight = { ...mockAssessment, weightKg: 85, heightCm: 180 };
      
      const recommendations = await NutritionAIEngine.generateRecommendations(
        patientWithoutWeight,
        assessmentWithWeight
      );
      
      expect(recommendations).toHaveLength(3);
      const proteinRec = recommendations.find(r => r.recommendationType === 'protein');
      // Should calculate based on fallback weight (85kg) -> Math.round(0.8 * 85 * 1.5) = 102
      expect(proteinRec?.value).toBe(102);
    });
  });

  describe('RiskPredictionAIEngine', () => {
    it('should predict risks and levels accurately', async () => {
      const risks = await RiskPredictionAIEngine.predictRisks(
        mockPatient,
        mockAssessment,
        mockHistory
      );

      expect(risks).toHaveLength(3);
      
      const malnutritionRisk = risks.find(r => r.riskType === 'malnutrition');
      expect(malnutritionRisk).toBeDefined();
      expect(malnutritionRisk?.riskScore).toBe(80); // Math.round(0.8 * 100)
      expect(malnutritionRisk?.riskLevel).toBe('critical'); // score >= 0.75 is critical
      expect(malnutritionRisk?.severity).toBe('severe'); // score >= 0.66 is severe
      expect(malnutritionRisk?.isFlagged).toBe(true); // score > 0.7
      expect(malnutritionRisk?.factors).toBeInstanceOf(Array);
      expect(malnutritionRisk?.recommendations).toBeInstanceOf(Array);
    });
  });
});
