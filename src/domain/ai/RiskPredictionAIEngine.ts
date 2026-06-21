import { Patient } from '../entities/Patient';
import { AIRiskPrediction, AIRiskLevel } from '../types/ai';
import { localAIModelManager } from './LocalAIModelManager';
import * as tf from '@tensorflow/tfjs';

export class RiskPredictionAIEngine {
  
  /**
   * Predict patient risks using AI
   * @param patient - Patient data
   * @param assessment - Clinical assessment
   * @param history - Patient history
   * @returns Risk predictions
   */
  static async predictRisks(
    patient: Patient & { weight?: number; height?: number },
    assessment: any,
    history: any[]
  ): Promise<AIRiskPrediction[]> {
    
    try {
      console.log('[RiskPredictionAIEngine] Predicting patient risks...');
      
      // Initialize TensorFlow
      if (!localAIModelManager.isInitialized()) {
        await localAIModelManager.initialize();
      }
      
      // Load risk model
      if (!localAIModelManager.isModelLoaded('risk')) {
        await localAIModelManager.loadModel(
          'risk',
          './models/risk_prediction_model.tflite'
        );
      }

      // Prepare input
      const inputFeatures = this.prepareInputFeatures(patient, assessment, history);
      console.log(`[RiskPredictionAIEngine] Input features: [${inputFeatures.join(', ')}]`);
      
      const inputTensor = tf.tensor2d([inputFeatures], [1, inputFeatures.length]);
      
      // Run inference
      const outputData = await localAIModelManager.runInferenceAndGetArray(
        'risk',
        inputTensor
      );
      
      console.log(`[RiskPredictionAIEngine] Output data: [${outputData.join(', ')}]`);
      
      const score = outputData[0] || 0.3; // safe fallback
      
      // Generate risk predictions
      const risks: AIRiskPrediction[] = [
        {
          id: `ai-risk-${patient.id}-${Date.now()}-malnutrition`,
          patientId: patient.id,
          riskType: 'malnutrition',
          riskScore: Math.round(score * 100),
          riskLevel: this.getRiskLevel(score),
          confidence: score,
          factors: this.getRiskFactors('malnutrition', patient, assessment),
          recommendations: this.getRecommendations('malnutrition'),
          severity: this.getSeverity(score),
          isFlagged: score > 0.7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `ai-risk-${patient.id}-${Date.now()}-dehydration`,
          patientId: patient.id,
          riskType: 'dehydration',
          riskScore: Math.round(score * 100),
          riskLevel: this.getRiskLevel(score),
          confidence: score,
          factors: this.getRiskFactors('dehydration', patient, assessment),
          recommendations: this.getRecommendations('dehydration'),
          severity: this.getSeverity(score),
          isFlagged: score > 0.7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `ai-risk-${patient.id}-${Date.now()}-hyperglycemia`,
          patientId: patient.id,
          riskType: 'hyperglycemia',
          riskScore: Math.round(score * 100),
          riskLevel: this.getRiskLevel(score),
          confidence: score,
          factors: this.getRiskFactors('hyperglycemia', patient, assessment),
          recommendations: this.getRecommendations('hyperglycemia'),
          severity: this.getSeverity(score),
          isFlagged: score > 0.7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      // Clean up
      inputTensor.dispose();
      
      console.log(`[RiskPredictionAIEngine] Predicted ${risks.length} risks`);
      return risks;
    } catch (err: any) {
      console.error('[RiskPredictionAIEngine] Predict risks failed:', err);
      throw new Error('Failed to predict AI risks: ' + err.message);
    }
  }

  /**
   * Prepare input features
   */
  private static prepareInputFeatures(
    patient: Patient & { weight?: number; height?: number },
    assessment: any,
    history: any[]
  ): number[] {
    const weight = patient.weight ?? assessment?.weightKg ?? 70;
    const height = patient.height ?? assessment?.heightCm ?? 170;
    return [
      patient.age / 100,
      weight / 150,
      height / 250,
      (assessment?.bmi || 20) / 40,
      (assessment?.fluidIntake || 1500) / 3000,
      (history?.length || 0) / 100,
      patient.gender === 'male' ? 1 : 0,
    ];
  }

  /**
   * Get risk level from score
   */
  private static getRiskLevel(score: number): AIRiskLevel {
    if (score < 0.25) return 'low';
    if (score < 0.5) return 'moderate';
    if (score < 0.75) return 'high';
    return 'critical';
  }

  /**
   * Get severity from score
   */
  private static getSeverity(score: number): 'mild' | 'moderate' | 'severe' {
    if (score < 0.33) return 'mild';
    if (score < 0.66) return 'moderate';
    return 'severe';
  }

  /**
   * Get risk factors
   */
  private static getRiskFactors(
    type: string,
    patient: Patient & { weight?: number; height?: number },
    assessment: any
  ): string[] {
    const factors: string[] = [];
    const weight = patient.weight ?? assessment?.weightKg ?? 70;
    
    if (type === 'malnutrition') {
      if (weight < 50) factors.push('Low weight (<50kg)');
      if (assessment?.bmi && assessment.bmi < 18.5) factors.push('Underweight (BMI <18.5)');
      if (assessment?.proteinIntake && assessment.proteinIntake < 0.8) factors.push('Low protein intake');
      if (assessment?.calorieIntake && assessment.calorieIntake < 1200) factors.push('Low calorie intake');
    } else if (type === 'dehydration') {
      if (assessment?.fluidIntake && assessment.fluidIntake < 1500) factors.push('Low fluid intake');
      if (assessment?.urineOutput && assessment.urineOutput < 0.5) factors.push('Low urine output');
    } else if (type === 'hyperglycemia') {
      if (assessment?.glucoseLevel && assessment.glucoseLevel > 180) factors.push('High glucose level');
      if (patient.notes?.toLowerCase().includes('diabetes')) factors.push('Diabetes history');
    }
    
    if (factors.length === 0) {
      factors.push('AI-predicted risk based on clinical profile');
    }
    
    return factors;
  }

  /**
   * Get recommendations
   */
  private static getRecommendations(type: string): string[] {
    if (type === 'malnutrition') {
      return [
        'Increase protein intake to 1.2-1.5 g/kg',
        'Monitor weight weekly',
        'Consider nutritional supplementation',
        'Evaluate dietary preferences and restrictions',
      ];
    } else if (type === 'dehydration') {
      return [
        'Increase fluid intake to 2000-2500 mL/day',
        'Monitor urine color and output',
        'Evaluate electrolyte balance',
        'Consider IV fluids if severe',
      ];
    } else if (type === 'hyperglycemia') {
      return [
        'Monitor glucose levels regularly',
        'Adjust carbohydrate intake',
        'Evaluate insulin therapy',
        'Consider dietary consultation',
      ];
    }
    
    return ['Follow clinical guidelines and monitor closely'];
  }
}
