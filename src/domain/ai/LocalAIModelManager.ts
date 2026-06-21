import * as tf from '@tensorflow/tfjs';
// TensorFlowBackend is not a named export from @tensorflow/tfjs-react-native in all versions.
// Use the bundled backend registration pattern instead.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AIModel {
  name: string;
  version: string;
  path: string;
  loaded: boolean;
  model: tf.GraphModel | null;
  inputShape: number[];
  outputShape: number[];
}

export class LocalAIModelManager {
  private models: Map<string, AIModel> = new Map();
  private tfInitialized: boolean = false;
  private readonly MODEL_CACHE_KEY = 'ai_models_cache';

  /**
   * Initialize TensorFlow.js with React Native backend
   */
  async initialize(): Promise<void> {
    if (this.tfInitialized) {
      console.log('[LocalAIModelManager] Already initialized');
      return;
    }

    try {
      console.log('[LocalAIModelManager] Initializing TensorFlow.js...');
      
      // Dynamically import and register the react-native backend
      try {
        const tfRN = await import('@tensorflow/tfjs-react-native');
        await (tfRN as any).bundleResourceIO?.();
      } catch {
        // Fallback: set cpu backend if react-native backend unavailable
        await tf.setBackend('cpu');
      }
      
      // Verify backend is ready
      const backend = tf.getBackend();
      if (!backend) {
        throw new Error('Failed to get TensorFlow backend');
      }
      
      this.tfInitialized = true;
      console.log('[LocalAIModelManager] TensorFlow initialized successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[LocalAIModelManager] Initialization failed:', message);
      throw new Error('Failed to initialize TensorFlow.js: ' + message);
    }
  }


  /**
   * Check if TensorFlow is initialized
   */
  isInitialized(): boolean {
    return this.tfInitialized;
  }

  /**
   * Load AI model from local storage
   */
  async loadModel(modelName: string, modelPath: string): Promise<AIModel> {
    try {
      console.log(`[LocalAIModelManager] Loading model ${modelName} from ${modelPath}`);
      
      // Check if model already loaded
      if (this.models.has(modelName)) {
        const existingModel = this.models.get(modelName)!;
        if (existingModel.loaded) {
          console.log(`[LocalAIModelManager] Model ${modelName} already loaded`);
          return existingModel;
        }
      }

      // Load model from file
      const model = await tf.loadGraphModel(modelPath);
      
      // Get model shapes safely
      const inputShape = model.inputs?.[0]?.shape || [];
      const outputShape = model.outputs?.[0]?.shape || [];

      const aiModel: AIModel = {
        name: modelName,
        version: '1.0.0',
        path: modelPath,
        loaded: true,
        model: model,
        inputShape: inputShape,
        outputShape: outputShape,
      };

      this.models.set(modelName, aiModel);
      
      // Update cache
      await this.updateModelCache(modelName);
      
      console.log(`[LocalAIModelManager] Model ${modelName} loaded successfully`);
      console.log(`  Input shape: [${inputShape.join(', ')}]`);
      console.log(`  Output shape: [${outputShape.join(', ')}]`);
      
      return aiModel;
    } catch (err: any) {
      console.error(`[LocalAIModelManager] Failed to load model ${modelName}:`, err);
      throw new Error(`Failed to load AI model: ${modelName} - ${err.message}`);
    }
  }

  /**
   * Run inference with loaded model
   */
  async runInference(
    modelName: string,
    input: tf.Tensor
  ): Promise<tf.Tensor> {
    try {
      const aiModel = this.models.get(modelName);
      
      if (!aiModel) {
        throw new Error(`Model ${modelName} not found`);
      }
      
      if (!aiModel.loaded || !aiModel.model) {
        throw new Error(`Model ${modelName} not loaded`);
      }

      // Validate input shape
      const inputShape = input.shape;
      const expectedShape = aiModel.inputShape;
      
      if (expectedShape.length > 0 && inputShape.length !== expectedShape.length) {
        throw new Error(
          `Input shape mismatch: expected [${expectedShape.join(', ')}], got [${inputShape.join(', ')}]`
        );
      }

      // Run inference
      const startTime = Date.now();
      const output = aiModel.model.predict(input) as tf.Tensor;
      const endTime = Date.now();
      
      console.log(`[LocalAIModelManager] Inference completed for ${modelName}`);
      console.log(`  Time: ${endTime - startTime}ms`);
      console.log(`  Output shape: [${output.shape.join(', ')}]`);
      
      return output;
    } catch (err: any) {
      console.error(`[LocalAIModelManager] Inference failed for ${modelName}:`, err);
      throw new Error(`Failed to run inference: ${modelName} - ${err.message}`);
    }
  }

  /**
   * Run inference and get data as array
   */
  async runInferenceAndGetArray(
    modelName: string,
    input: tf.Tensor
  ): Promise<number[]> {
    try {
      const outputTensor = await this.runInference(modelName, input);
      const outputData = await outputTensor.data();
      
      // Clean up tensor
      outputTensor.dispose();
      
      return Array.from(outputData);
    } catch (err: any) {
      console.error(`[LocalAIModelManager] Inference array failed for ${modelName}:`, err);
      throw err;
    }
  }

  /**
   * Unload model from memory
   */
  async unloadModel(modelName: string): Promise<void> {
    try {
      const aiModel = this.models.get(modelName);
      
      if (aiModel && aiModel.model) {
        aiModel.model.dispose();
        console.log(`[LocalAIModelManager] Model ${modelName} disposed`);
      }
      
      this.models.delete(modelName);
      
      // Update cache
      await this.updateModelCache(modelName);
      
      console.log(`[LocalAIModelManager] Model ${modelName} unloaded`);
    } catch (err) {
      console.error(`[LocalAIModelManager] Failed to unload model ${modelName}:`, err);
    }
  }

  /**
   * Get all loaded models
   */
  getLoadedModels(): string[] {
    return Array.from(this.models.keys());
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(modelName: string): boolean {
    const model = this.models.get(modelName);
    return !!(model && model.loaded);
  }

  /**
   * Get model metadata
   */
  getModelMetadata(modelName: string): AIModel | undefined {
    return this.models.get(modelName);
  }

  /**
   * Update model cache
   */
  private async updateModelCache(modelName: string): Promise<void> {
    try {
      const cachedModels = await AsyncStorage.getItem(this.MODEL_CACHE_KEY);
      const modelsList = cachedModels ? JSON.parse(cachedModels) : [];
      
      const model = this.models.get(modelName);
      if (model) {
        const existingIndex = modelsList.findIndex((m: any) => m.name === modelName);
        if (existingIndex >= 0) {
          modelsList[existingIndex] = {
            name: model.name,
            loaded: model.loaded,
            lastUsed: new Date().toISOString(),
          };
        } else {
          modelsList.push({
            name: model.name,
            loaded: model.loaded,
            lastUsed: new Date().toISOString(),
          });
        }
      }
      
      await AsyncStorage.setItem(this.MODEL_CACHE_KEY, JSON.stringify(modelsList));
    } catch (err) {
      console.error('[LocalAIModelManager] Failed to update cache:', err);
    }
  }

  /**
   * Clean up all models
   */
  async cleanup(): Promise<void> {
    console.log('[LocalAIModelManager] Cleaning up all models...');
    
    for (const modelName of this.getLoadedModels()) {
      await this.unloadModel(modelName);
    }
    
    this.tfInitialized = false;
    console.log('[LocalAIModelManager] Cleanup completed');
  }

  /**
   * Dispose TensorFlow backend
   */
  async dispose(): Promise<void> {
    await this.cleanup();
    
    try {
      tf.removeBackend('react-native');
      console.log('[LocalAIModelManager] TensorFlow backend disposed');
    } catch (err) {
      console.error('[LocalAIModelManager] Failed to dispose backend:', err);
    }
  }
}

// Singleton instance
export const localAIModelManager = new LocalAIModelManager();
