import { describe, expect, it } from 'vitest';
import { estimateQuick, isQuickInputs, quickDefaults } from './quickEstimate';

describe('quick estimate', () => {
  it('treats entered debt as the full graduation balance and living costs as monthly', () => {
    const results = estimateQuick({
      debtA: 0,
      salaryA: 60000,
      debtB: 12000,
      salaryB: 60000,
      monthlyLiving: 2000,
    })!;
    expect(results[0].snapshots).toHaveLength(121);
    expect(results[0].firstBudget.takeHomeIncome).toBe(3900);
    expect(results[0].firstBudget.livingExpenses).toBe(2000);
    expect(results[0].firstBudget.accumulatedCash).toBe(1900);
    expect(results[1].snapshots[0].netWorth).toBe(-12000);
    expect(results[1].loanPrincipal).toBe(12000);
    expect(results[1].loan.monthlyPayment).toBeCloseTo(136.26, 2);
    expect(results[1].firstBudget.accumulatedCash).toBeCloseTo(1763.74, 2);
    expect(results[1].snapshots.at(-1)!.remainingLoanBalance).toBe(0);
  });

  it('supports zero inputs and preserves a negative funding gap', () => {
    const empty = {
      debtA: 0,
      salaryA: 0,
      debtB: 0,
      salaryB: 0,
      monthlyLiving: 0,
    };
    expect(estimateQuick(empty)![0].snapshots.at(-1)!.netWorth).toBe(0);
    const gap = estimateQuick({ ...empty, monthlyLiving: 1000 })![0];
    expect(gap.firstBudget.netWorth).toBe(-1000);
    expect(gap.snapshots.at(-1)!.netWorth).toBeLessThan(-120000);
  });

  it('withholds projections for missing or invalid values instead of using stale amounts', () => {
    expect(estimateQuick({ ...quickDefaults, debtA: null })).toBeNull();
    expect(estimateQuick({ ...quickDefaults, monthlyLiving: -1 })).toBeNull();
    expect(estimateQuick({ ...quickDefaults, salaryB: Infinity })).toBeNull();
    expect(estimateQuick({ ...quickDefaults, debtB: 2000001 })).toBeNull();
    expect(isQuickInputs({})).toBe(false);
    expect(isQuickInputs({ ...quickDefaults, debtA: '56000' })).toBe(false);
  });
});
