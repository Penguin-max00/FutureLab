import { describe, expect, it } from 'vitest';
import { collegeCost } from './collegeCost';
import { calculateLoan } from './loanCalculator';
import { simulate } from './simulation';
import { monthlyAmount } from './cashflow';
import { defaults, isWorkspace } from '../state/defaults';
const college = defaults.colleges[0];
const assumptions = defaults.assumptions;
describe('College costs', () => {
  it('deducts annual aid and then total family contribution', () => {
    expect(collegeCost(college)).toEqual({
      annualNetCost: 24000,
      totalCost: 96000,
      loanPrincipal: 56000,
    });
  });
  it('floors costs and borrowing at zero', () => {
    expect(collegeCost({ ...college, scholarships: 999999 }).totalCost).toBe(0);
    expect(
      collegeCost({ ...college, familyContribution: 999999 }).loanPrincipal,
    ).toBe(0);
  });
});
describe('Fixed-rate loan amortization', () => {
  it('matches a known fixed-rate payment', () => {
    expect(calculateLoan(10000, 0.06, 10).monthlyPayment).toBe(111.02);
  });
  it('supports zero interest and exact final settlement', () => {
    const loan = calculateLoan(1000, 0, 1);
    expect(loan.monthlyPayment).toBe(83.33);
    expect(loan.totalInterest).toBe(0);
    expect(loan.payments.at(-1)?.payment).toBe(83.37);
    expect(loan.payments.reduce((s, p) => s + p.principal, 0)).toBeCloseTo(
      1000,
      8,
    );
  });
  it('returns an empty schedule for no debt', () => {
    expect(calculateLoan(0, 0.06, 10)).toEqual({
      monthlyPayment: 0,
      totalInterest: 0,
      payments: [],
    });
  });
  it.each([1, 10, 30])(
    'pays off without negative balances over %i years',
    (years) => {
      const loan = calculateLoan(56000, 0.065, years);
      expect(loan.payments).toHaveLength(years * 12);
      expect(loan.payments.at(-1)?.balance).toBe(0);
      expect(loan.payments.every((p) => p.balance >= 0)).toBe(true);
      expect(loan.payments.reduce((s, p) => s + p.principal, 0)).toBeCloseTo(
        56000,
        6,
      );
      expect(loan.payments.reduce((s, p) => s + p.payment, 0)).toBeCloseTo(
        56000 + loan.totalInterest,
        6,
      );
    },
  );
  it('handles a tiny principal and tiny rate', () => {
    expect(calculateLoan(0.01, 0, 30).payments.at(-1)?.balance).toBe(0);
    expect(calculateLoan(1000, 1e-12, 1).monthlyPayment).toBe(83.33);
  });
  it('rejects invalid loan inputs', () => {
    expect(() => calculateLoan(-1, 0.06, 10)).toThrow();
    expect(() => calculateLoan(10, 0.06, 0)).toThrow();
    expect(() => calculateLoan(10, NaN, 10)).toThrow();
  });
});
describe('Monthly simulation', () => {
  it('rejects nonfinite and invalid simulation inputs', () => {
    expect(() => simulate({ ...college, tuition: NaN }, assumptions)).toThrow();
    expect(() => simulate(college, { ...assumptions, taxRate: 2 })).toThrow();
    expect(() =>
      simulate(college, { ...assumptions, salaryGrowth: -1 }),
    ).toThrow();
    expect(() =>
      simulate(college, { ...assumptions, horizonYears: 0 }),
    ).toThrow();
  });
  it('retains negative cash and net worth', () => {
    const r = simulate({ ...college, startingSalary: 0 }, assumptions);
    expect(r.snapshots[1].accumulatedCash).toBeLessThan(0);
    expect(r.snapshots[1].netWorth).toBeLessThan(-r.loanPrincipal);
  });
  it('uses effective annual growth at monthly steps', () => {
    expect(monthlyAmount(60000, 0.03, 12)).toBeCloseTo(5150, 8);
    const r = simulate(college, assumptions);
    expect(r.snapshots[13].grossIncome).toBeCloseTo(
      (college.startingSalary / 12) * 1.03,
      8,
    );
    expect(r.snapshots[13].livingExpenses).toBeCloseTo(
      (assumptions.annualLivingExpenses / 12) * 1.025,
      8,
    );
  });
  it('reconciles all cash flows and net worth month by month', () => {
    const r = simulate(college, assumptions);
    expect(r.snapshots).toHaveLength(181);
    expect(r.snapshots[0].netWorth).toBe(-56000);
    for (let i = 1; i < r.snapshots.length; i++) {
      const p = r.snapshots[i];
      expect(p.netWorth).toBe(p.accumulatedCash - p.remainingLoanBalance);
      expect(
        p.accumulatedCash - r.snapshots[i - 1].accumulatedCash,
      ).toBeCloseTo(p.takeHomeIncome - p.livingExpenses - p.loanPayment, 7);
      expect(p.takeHomeIncome).toBeCloseTo(p.grossIncome * 0.78, 7);
    }
    expect(r.snapshots[120].remainingLoanBalance).toBe(0);
    expect(r.snapshots[121].loanPayment).toBe(0);
  });
  it('preserves the remaining loan for a short horizon', () => {
    const r = simulate(college, { ...assumptions, horizonYears: 1 });
    expect(r.snapshots.at(-1)?.remainingLoanBalance).toBe(
      r.loan.payments[11].balance,
    );
    expect(r.snapshots.at(-1)?.remainingLoanBalance).toBeGreaterThan(0);
  });
  it('produces deterministic outputs without mutating inputs', () => {
    const before = JSON.stringify(defaults);
    expect(simulate(college, assumptions)).toEqual(
      simulate(college, assumptions),
    );
    expect(JSON.stringify(defaults)).toBe(before);
  });
});
describe('Saved workspace validation', () => {
  it('accepts examples and rejects corrupted or out-of-range data', () => {
    expect(isWorkspace(defaults)).toBe(true);
    expect(isWorkspace(null)).toBe(false);
    expect(
      isWorkspace({
        ...defaults,
        assumptions: { ...assumptions, horizonYears: 999 },
      }),
    ).toBe(false);
    expect(
      isWorkspace({
        ...defaults,
        colleges: [{ ...college, tuition: -1 }, college],
      }),
    ).toBe(false);
    expect(
      isWorkspace({
        ...defaults,
        assumptions: { ...assumptions, repaymentYears: 1.5 },
      }),
    ).toBe(false);
  });
});
