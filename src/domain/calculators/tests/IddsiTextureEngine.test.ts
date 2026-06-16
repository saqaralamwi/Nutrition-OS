import { describe, it, expect } from 'vitest';
import { IddsiTextureEngine } from '../IddsiTextureEngine';

describe('IddsiTextureEngine', () => {
  it('severe stroke age 72 → liquid 4, pureed 4, geriatric warning', () => {
    const result = IddsiTextureEngine.evaluateIddsiRequirement({
      patientAgeYears: 72,
      hasDysphagia: true,
      clinicalCondition: 'stroke',
      dysphagiaSeverity: 'severe',
    });

    expect(result.liquidLevelCode).toBe(4);
    expect(result.liquidLevelNameAr).toContain('قوام محقون');
    expect(result.foodTextureCode).toBe(4);
    expect(result.foodTextureNameAr).toContain('مهروس');
    expect(result.arabicClinicalAlerts.some(a => a.includes('الارتشاف الرئوي الصامت'))).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  it('mild parkinson age 60 → liquid 2, soft bite-sized, no geriatric alert', () => {
    const result = IddsiTextureEngine.evaluateIddsiRequirement({
      patientAgeYears: 60,
      hasDysphagia: true,
      clinicalCondition: 'parkinson',
      dysphagiaSeverity: 'mild',
    });

    expect(result.liquidLevelCode).toBe(2);
    expect(result.liquidLevelNameAr).toContain('سميكة قليلاً');
    expect(result.foodTextureCode).toBe(6);
    expect(result.foodTextureNameAr).toContain('لينة');
    expect(result.arabicClinicalAlerts.length).toBe(0);
    expect(result.isSafe).toBe(true);
  });

  it('healthy age 45 → liquid 0, regular food 7', () => {
    const result = IddsiTextureEngine.evaluateIddsiRequirement({
      patientAgeYears: 45,
      hasDysphagia: false,
      clinicalCondition: 'none',
      dysphagiaSeverity: 'none',
    });

    expect(result.liquidLevelCode).toBe(0);
    expect(result.foodTextureCode).toBe(7);
    expect(result.arabicClinicalAlerts.length).toBe(0);
    expect(result.isSafe).toBe(true);
  });

  it('invalid age 0 → safe fallback with validation message', () => {
    const result = IddsiTextureEngine.evaluateIddsiRequirement({
      patientAgeYears: 0,
      hasDysphagia: true,
      clinicalCondition: 'dementia',
      dysphagiaSeverity: 'moderate',
    });

    expect(result.isSafe).toBe(false);
    expect(result.liquidLevelCode).toBe(0);
    expect(result.foodTextureCode).toBe(7);
    expect(result.arabicClinicalAlerts).toContain('الرجاء إدخال عمر صحيح للمريض (عدد موجب)');
  });

  it('moderate dementia age 80 → liquid 3, minced 5, geriatric warning', () => {
    const result = IddsiTextureEngine.evaluateIddsiRequirement({
      patientAgeYears: 80,
      hasDysphagia: true,
      clinicalCondition: 'dementia',
      dysphagiaSeverity: 'moderate',
    });

    expect(result.liquidLevelCode).toBe(3);
    expect(result.liquidLevelNameAr).toContain('سميكة متوسطاً');
    expect(result.foodTextureCode).toBe(5);
    expect(result.foodTextureNameAr).toContain('مفروم');
    expect(result.arabicClinicalAlerts.some(a => a.includes('الارتشاف الرئوي الصامت'))).toBe(true);
    expect(result.isSafe).toBe(true);
  });
});
