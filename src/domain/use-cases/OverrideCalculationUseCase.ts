import { getDatabase } from '../../data/database';
import CalculationModel from '../../data/models/Calculation';
import CalculationOverrideModel from '../../data/models/CalculationOverride';
import { CalculationResult } from '../entities/Calculation';

export interface OverrideInput {
  calculationId: string;
  patientId: string;
  overriddenValue: number;
  reason: string;
  overriddenBy: string;
}

export class OverrideCalculationUseCase {
  async execute(input: OverrideInput): Promise<CalculationResult> {
    const { calculationId, patientId, overriddenValue, reason, overriddenBy } = input;

    const db = await getDatabase();
    const calcRecord = await db.get<CalculationModel>('calculations').find(calculationId);

    const originalValue = calcRecord.resultValue;
    const currentInputValues = JSON.parse(calcRecord.inputValues || '{}');
    currentInputValues.originalValue = originalValue;
    currentInputValues.overriddenBy = overriddenBy;
    currentInputValues.overrideReason = reason;

    const now = new Date();

    await db.write(async () => {
      const overrideOp = db.get<CalculationOverrideModel>('calculation_overrides').prepareCreate((r) => {
        r.calculationId = calculationId;
        r.originalValue = originalValue;
        r.overriddenValue = overriddenValue;
        r.reason = reason;
        r.overriddenBy = overriddenBy;
        r.createdAt = now;
      });

      const updateOp = calcRecord.prepareUpdate((r) => {
        r.isOverridden = true;
        r.overrideValue = overriddenValue;
        r.overrideReason = reason;
        r.inputValues = JSON.stringify(currentInputValues);
        r.updatedAt = now;
      });

      await db.batch(overrideOp, updateOp);
    });

    return {
      id: calculationId,
      patientId,
      calculationType: calcRecord.calculationType,
      formulaName: calcRecord.formulaName,
      inputValues: currentInputValues,
      resultValue: originalValue,
      isOverridden: true,
      overrideValue: overriddenValue,
      overrideReason: reason,
    };
  }
}
