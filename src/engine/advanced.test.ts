import { describe, expect, it } from 'vitest';
import { defaults, isExampleWorkspace, isWorkspace } from '../state/defaults';
import { educationProjection } from './collegeCost';
import { simulate } from './simulation';
import { experimentInputs, initialExploration } from './experiments';
import { newPersonalDraft, isPersonalDraft } from '../state/personalDraft';
import { readLibrary, sameComparison, snapshot } from '../state/savedPlans';

const college = {
  ...defaults.colleges[0],
  tuition: 10000,
  livingCost: 0,
  scholarships: 1000,
  yearsOfAttendance: 2,
  familyContribution: 5000,
};
describe('advanced cost and employment assumptions', () => {
  it('grows tuition and living costs, keeps aid fixed, and capitalizes simple interest once', () => {
    expect(
      educationProjection(college, {
        collegeCostGrowth: 0.1,
        inSchoolInterestRate: 0.1,
      }),
    ).toEqual({
      annualNetCost: 9000,
      totalCost: 19000,
      borrowedPrincipal: 14000,
      inSchoolInterest: 1800,
      loanPrincipal: 15800,
      years: [
        { net: 9000, contribution: 5000, borrowed: 4000 },
        { net: 10000, contribution: 0, borrowed: 10000 },
      ],
    });
  });
  it('uses family funds first and never charges interest without borrowing', () => {
    expect(
      educationProjection(
        { ...college, familyContribution: 9000 },
        { inSchoolInterestRate: 0.1 },
      ).inSchoolInterest,
    ).toBe(900);
    expect(
      educationProjection(
        { ...college, familyContribution: 100000 },
        { collegeCostGrowth: 0.1, inSchoolInterestRate: 0.1 },
      ).loanPrincipal,
    ).toBe(0);
    expect(
      educationProjection(
        { ...college, scholarships: 100000 },
        { inSchoolInterestRate: 0.1 },
      ).totalCost,
    ).toBe(0);
  });
  it('continues spending and repayment without income, then begins wages at the entered starting salary', () => {
    const assumptions = {
      ...defaults.assumptions,
      jobSearchMonthsA: 6,
      jobSearchMonthsB: 2,
    };
    const a = simulate(defaults.colleges[0], assumptions, 0);
    const b = simulate(defaults.colleges[1], assumptions, 1);
    expect(
      a.snapshots
        .slice(1, 7)
        .every(
          (month) =>
            month.grossIncome === 0 &&
            month.takeHomeIncome === 0 &&
            month.livingExpenses > 0 &&
            month.loanPayment > 0,
        ),
    ).toBe(true);
    expect(a.snapshots[6].accumulatedCash).toBeLessThan(0);
    expect(a.snapshots[7].grossIncome).toBe(
      defaults.colleges[0].startingSalary / 12,
    );
    expect(a.snapshots[19].grossIncome).toBeCloseTo(
      (defaults.colleges[0].startingSalary / 12) * 1.03,
    );
    expect(a.snapshots[13].livingExpenses).toBeCloseTo(2500 * 1.025);
    expect(b.snapshots[2].grossIncome).toBe(0);
    expect(b.snapshots[3].grossIncome).toBe(
      defaults.colleges[1].startingSalary / 12,
    );
  });
  it('supports job-search delays longer than the projection horizon', () => {
    const result = simulate(defaults.colleges[0], {
      ...defaults.assumptions,
      horizonYears: 1,
      jobSearchMonthsA: 60,
    });
    expect(result.snapshots.every((month) => month.grossIncome === 0)).toBe(
      true,
    );
    expect(result.snapshots.at(-1)!.accumulatedCash).toBeLessThan(0);
  });
  it('feeds capitalized interest into graduation debt, amortization and net worth exactly once', () => {
    const result = simulate(college, {
      ...defaults.assumptions,
      collegeCostGrowth: 0.1,
      inSchoolInterestRate: 0.1,
    });
    expect(result.snapshots[0].remainingLoanBalance).toBe(15800);
    expect(result.snapshots[0].netWorth).toBe(-15800);
    expect(
      result.loan.payments.reduce((sum, payment) => sum + payment.principal, 0),
    ).toBeCloseTo(15800);
    expect(result.snapshots.at(-1)!.remainingLoanBalance).toBe(0);
  });
  it('preserves legacy workspaces, drafts, snapshots and exact zero-option simulation results', () => {
    const legacy = structuredClone(defaults);
    delete legacy.assumptions.jobSearchMonthsA;
    delete legacy.assumptions.jobSearchMonthsB;
    delete legacy.assumptions.collegeCostGrowth;
    delete legacy.assumptions.inSchoolInterestRate;
    expect(isWorkspace(legacy)).toBe(true);
    expect(isExampleWorkspace(legacy)).toBe(true);
    expect(isPersonalDraft(newPersonalDraft(legacy.assumptions))).toBe(true);
    expect(simulate(defaults.colleges[0], legacy.assumptions)).toEqual(
      simulate(defaults.colleges[0], defaults.assumptions),
    );
    const plan = snapshot(
      { workspace: legacy, exploration: initialExploration() },
      'old',
      'Legacy',
      1,
    );
    expect(
      sameComparison(plan, {
        workspace: defaults,
        exploration: initialExploration(),
      }),
    ).toBe(true);
    expect(
      readLibrary({
        getItem: () =>
          JSON.stringify({ version: 1, plans: [plan], activeId: 'old' }),
      }).plans[0],
    ).toEqual(plan);
  });
  it('recognizes advanced edits and retains them through scenario transforms and saved plans', () => {
    const workspace = structuredClone(defaults);
    workspace.assumptions.jobSearchMonthsB = 5;
    workspace.assumptions.collegeCostGrowth = 0.05;
    workspace.assumptions.inSchoolInterestRate = 0.04;
    const exploration = {
      ...initialExploration(),
      scenario: 'optimistic' as const,
    };
    const transformed = experimentInputs(workspace, exploration);
    expect(transformed.inputs.assumptions.jobSearchMonthsB).toBe(5);
    expect(transformed.inputs.assumptions.collegeCostGrowth).toBe(0.05);
    const plan = snapshot({ workspace, exploration }, 'new', 'Advanced', 1);
    expect(sameComparison(plan, { workspace: defaults, exploration })).toBe(
      false,
    );
    expect(isExampleWorkspace(workspace)).toBe(false);
    expect(plan.workspace.assumptions.inSchoolInterestRate).toBe(0.04);
  });
  it.each([
    ['jobSearchMonthsA', -1],
    ['jobSearchMonthsB', 1.5],
    ['jobSearchMonthsA', 61],
    ['collegeCostGrowth', 0.21],
    ['inSchoolInterestRate', 0.26],
    ['inSchoolInterestRate', null],
  ])('rejects invalid %s = %s at the storage boundary', (key, value) => {
    const workspace = structuredClone(defaults);
    Object.assign(workspace.assumptions, { [key]: value });
    expect(isWorkspace(workspace)).toBe(false);
  });
  it('rejects invalid engine options', () => {
    expect(() =>
      simulate(college, { ...defaults.assumptions, jobSearchMonthsA: 1.5 }),
    ).toThrow();
    expect(() =>
      educationProjection(college, { collegeCostGrowth: -0.01 }),
    ).toThrow();
    expect(() =>
      educationProjection(college, { inSchoolInterestRate: Infinity }),
    ).toThrow();
  });
});
