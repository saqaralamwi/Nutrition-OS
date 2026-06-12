import { InterpretationResult } from '../entities/LabResult';

export interface InterpretLabResultInput {
  resultValue: number;
  referenceRangeLow: number;
  referenceRangeHigh: number;
  criticalLowFactor?: number | null;
  criticalHighFactor?: number | null;
}

export class InterpretLabResultUseCase {
  execute(input: InterpretLabResultInput): InterpretationResult {
    const { resultValue, referenceRangeLow, referenceRangeHigh, criticalLowFactor, criticalHighFactor } = input;

    if (referenceRangeLow >= referenceRangeHigh) {
      return 'normal';
    }

    if (criticalLowFactor != null && criticalLowFactor > 0) {
      const criticalLowThreshold = referenceRangeLow * criticalLowFactor;
      if (resultValue < criticalLowThreshold) {
        return 'critically_low';
      }
    }

    if (resultValue < referenceRangeLow) {
      return 'low';
    }

    if (criticalHighFactor != null && criticalHighFactor > 0) {
      const criticalHighThreshold = referenceRangeHigh * criticalHighFactor;
      if (resultValue > criticalHighThreshold) {
        return 'critically_high';
      }
    }

    if (resultValue > referenceRangeHigh) {
      return 'high';
    }

    return 'normal';
  }
}
