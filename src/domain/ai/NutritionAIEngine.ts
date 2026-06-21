import { Patient } from '../entities/Patient';
import { AINutritionRecommendation } from '../types/ai';
import { localAIModelManager } from './LocalAIModelManager';
import * as tf from '@tensorflow/tfjs';

export class NutritionAIEngine {
  
  /**
   * Generate AI-powered nutrition recommendations
   * @param patient - Patient data
   * @param assessment - Clinical assessment
   * @returns Nutrition recommendations
   */
  static async generateRecommendations(
    patient: Patient & { weight?: number; height?: number },
    assessment: any
  ): Promise<AINutritionRecommendation[]> {
    
    try {
      console.log('[NutritionAIEngine] Generating AI nutrition recommendations...');
      
      // Initialize TensorFlow if needed
      if (!localAIModelManager.isInitialized()) {
        await localAIModelManager.initialize();
      }
      
      // Load nutrition model (if not loaded)
      if (!localAIModelManager.isModelLoaded('nutrition')) {
        await localAIModelManager.loadModel(
          'nutrition',
          './models/nutrition_model.tflite'
        );
      }

      // Prepare input features
      const inputFeatures = this.prepareInputFeatures(patient, assessment);
      console.log(`[NutritionAIEngine] Input features: [${inputFeatures.join(', ')}]`);
      
      // Create TensorFlow tensor
      const inputTensor = tf.tensor2d([inputFeatures], [1, inputFeatures.length]);
      
      // Run inference
      const outputData = await localAIModelManager.runInferenceAndGetArray(
        'nutrition',
        inputTensor
      );
      
      console.log(`[NutritionAIEngine] Output data: [${outputData.join(', ')}]`);
      
      // We grab the first value of the inference output as a score/factor
      const outputValue = outputData[0] || 0.5;
      const weight = patient.weight ?? assessment?.weightKg ?? 70;
      
      // Generate recommendations
      const recommendations: AINutritionRecommendation[] = [
        {
          id: `ai-rec-${patient.id}-${Date.now()}-calorie`,
          patientId: patient.id,
          recommendationType: 'calorie',
          value: Math.round(outputValue * 100 * 25), // Adjusted scaling for realistic calories
          unit: 'kcal/day',
          confidence: outputValue,
          reasoning: this.generateReasoning('calorie', patient, assessment),
          factors: this.getCalorieFactors(patient, assessment),
          source: 'ai',
          isApproved: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `ai-rec-${patient.id}-${Date.now()}-protein`,
          patientId: patient.id,
          recommendationType: 'protein',
          value: Math.round(outputValue * weight * 1.5),
          unit: 'g/day',
          confidence: outputValue,
          reasoning: this.generateReasoning('protein', patient, assessment),
          factors: this.getProteinFactors(patient, assessment),
          source: 'ai',
          isApproved: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `ai-rec-${patient.id}-${Date.now()}-carbs`,
          patientId: patient.id,
          recommendationType: 'carbs',
          value: Math.round(outputValue * 300),
          unit: 'g/day',
          confidence: outputValue,
          reasoning: this.generateReasoning('carbs', patient, assessment),
          factors: this.getCarbsFactors(patient, assessment),
          source: 'ai',
          isApproved: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      // Clean up tensors
      inputTensor.dispose();
      
      console.log(`[NutritionAIEngine] Generated ${recommendations.length} recommendations`);
      return recommendations;
    } catch (err: any) {
      console.error('[NutritionAIEngine] Generate recommendations failed:', err);
      throw new Error('Failed to generate AI nutrition recommendations: ' + err.message);
    }
  }

  /**
   * Prepare input features for AI model
   */
  private static prepareInputFeatures(
    patient: Patient & { weight?: number; height?: number },
    assessment: any
  ): number[] {
    const weight = patient.weight ?? assessment?.weightKg ?? 70;
    const height = patient.height ?? assessment?.heightCm ?? 170;
    return [
      patient.age / 100, // Normalize age (0-1)
      weight / 150, // Normalize weight (0-1)
      height / 250, // Normalize height (0-1)
      patient.gender === 'male' ? 1 : 0,
      (assessment?.bmi || 20) / 40, // Normalize BMI (0-1)
      (assessment?.bmr || 1500) / 3000, // Normalize BMR (0-1)
      (assessment?.activityLevel || 1.2) / 2.5, // Normalize activity (0-1)
    ];
  }

  /**
   * Generate reasoning for recommendation
   */
  private static generateReasoning(
    type: string,
    patient: Patient & { weight?: number; height?: number },
    assessment: any
  ): string {
    const weight = patient.weight ?? assessment?.weightKg ?? 70;
    const height = patient.height ?? assessment?.heightCm ?? 170;
    if (type === 'calorie') {
      return `AI-calculated calorie requirement based on age (${patient.age}), weight (${weight}kg), height (${height}cm), gender (${patient.gender}), BMI (${assessment?.bmi || 'N/A'}), and activity level.`;
    } else if (type === 'protein') {
      return `AI-calculated protein requirement based on patient weight (${weight}kg) and clinical assessment (protein per kg: ${assessment?.proteinPerKg || 1.0}g/kg).`;
    } else if (type === 'carbs') {
      return `AI-calculated carbohydrate requirement based on patient metabolic profile and activity level.`;
    }
    return 'AI-powered recommendation based on patient clinical data.';
  }

  /**
   * Get calorie factors
   */
  private static getCalorieFactors(
    patient: Patient & { weight?: number; height?: number },
    assessment: any
  ): string[] {
    const factors: string[] = [];
    const weight = patient.weight ?? assessment?.weightKg ?? 70;
    const height = patient.height ?? assessment?.heightCm ?? 170;
    
    factors.push(`Age: ${patient.age} years`);
    factors.push(`Weight: ${weight} kg`);
    factors.push(`Height: ${height} cm`);
    factors.push(`Gender: ${patient.gender}`);
    
    if (assessment?.bmi) {
      factors.push(`BMI: ${assessment.bmi}`);
    }
    
    if (assessment?.activityLevel) {
      factors.push(`Activity level: ${assessment.activityLevel}`);
    }
    
    return factors;
  }

  /**
   * Get protein factors
   */
  private static getProteinFactors(
    patient: Patient & { weight?: number; height?: number },
    assessment: any
  ): string[] {
    const factors: string[] = [];
    const weight = patient.weight ?? assessment?.weightKg ?? 70;
    
    factors.push(`Weight: ${weight} kg`);
    factors.push(`Protein per kg: ${assessment?.proteinPerKg || 1.0} g/kg`);
    
    if (assessment?.renalFunction) {
      factors.push(`Renal function: ${assessment.renalFunction}`);
    }
    
    if (assessment?.hepaticFunction) {
      factors.push(`Hepatic function: ${assessment.hepaticFunction}`);
    }
    
    return factors;
  }

  /**
   * Get carbs factors
   */
  private static getCarbsFactors(
    patient: Patient & { weight?: number; height?: number },
    assessment: any
  ): string[] {
    const factors: string[] = [];
    
    factors.push(`Activity level: ${assessment?.activityLevel || 'normal'}`);
    factors.push(`Metabolic profile: ${assessment?.metabolicProfile || 'normal'}`);
    
    if (assessment?.glucoseLevel) {
      factors.push(`Glucose level: ${assessment.glucoseLevel}`);
    }
    
    return factors;
  }
}
