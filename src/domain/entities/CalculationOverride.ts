export interface CalculationOverride {
  id?: string;
  calculationId: string;
  originalValue: number;
  overriddenValue: number;
  reason: string;
  overriddenBy: string;
  createdAt?: string;
}
