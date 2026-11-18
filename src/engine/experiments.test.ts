import { describe, expect, it } from 'vitest';
import {
  changeCount,
  emptyChanges,
  experimentInputs,
  initialExploration,
  isExploration,
  scenarios,
} from './experiments';
import { defaults } from '../state/defaults';
import { simulate } from './simulation';
describe('Scenario derivation', () => {
  it('reproduces original inputs and outputs exactly in baseline', () => {
    const { inputs, limits } = experimentInputs(defaults, initialExploration());
    expect(inputs).toEqual(defaults);
    expect(limits).toEqual([]);
    expect(simulate(inputs.colleges[0], inputs.assumptions)).toEqual(
      simulate(defaults.colleges[0], defaults.assumptions),
    );
  });
  it('keeps original inputs untouched across repeated scenario switches', () => {
    const before = structuredClone(defaults);
    for (const scenario of [
      'optimistic',
      'conservative',
      'optimistic',
      'baseline',
    ] as const)
      experimentInputs(defaults, { scenario, changes: emptyChanges() });
    expect(defaults).toEqual(before);
  });
  it('applies scenario multipliers, percentage points, and quick changes in the disclosed order', () => {
    const { inputs } = experimentInputs(defaults, {
      scenario: 'optimistic',
      changes: {
        extraAid: [5000, 0],
        salaryChange: [0.2, 0],
        monthlyExpenseChange: -500,
      },
    });
    expect(inputs.colleges[0].startingSalary).toBeCloseTo(81840, 8);
    expect(inputs.colleges[0].scholarships).toBe(11500);
    expect(inputs.assumptions.salaryGrowth).toBeCloseTo(0.04, 8);
    expect(inputs.assumptions.expenseGrowth).toBeCloseTo(0.015, 8);
    expect(inputs.assumptions.annualLivingExpenses).toBe(21000);
    expect(inputs.assumptions.interestRate).toBe(
      defaults.assumptions.interestRate,
    );
    expect(inputs.assumptions.taxRate).toBe(defaults.assumptions.taxRate);
  });
  it('changes outcomes in the expected order without repricing the loan', () => {
    const outputs = scenarios.map((s) => {
      const { inputs } = experimentInputs(defaults, {
        scenario: s.id,
        changes: emptyChanges(),
      });
      return simulate(inputs.colleges[0], inputs.assumptions);
    });
    expect(outputs[0].snapshots.at(-1)!.netWorth).toBeLessThan(
      outputs[1].snapshots.at(-1)!.netWorth,
    );
    expect(outputs[1].snapshots.at(-1)!.netWorth).toBeLessThan(
      outputs[2].snapshots.at(-1)!.netWorth,
    );
    expect(outputs[0].loan).toEqual(outputs[1].loan);
    expect(outputs[2].loan).toEqual(outputs[1].loan);
  });
  it('adds annual aid over all attendance years and only to the selected college', () => {
    const { inputs } = experimentInputs(defaults, {
      scenario: 'baseline',
      changes: { ...emptyChanges(), extraAid: [5000, 0] },
    });
    const result = simulate(inputs.colleges[0], inputs.assumptions);
    expect(result.totalCost).toBe(76000);
    expect(result.loanPrincipal).toBe(36000);
    expect(inputs.colleges[1]).toEqual(defaults.colleges[1]);
    expect(result.loan.monthlyPayment).toBeLessThan(
      simulate(defaults.colleges[0], defaults.assumptions).loan.monthlyPayment,
    );
  });
  it('floors borrowing at zero when extra aid covers the degree', () => {
    const original = {
      ...defaults,
      colleges: [
        { ...defaults.colleges[0], familyContribution: 90000 },
        defaults.colleges[1],
      ] as typeof defaults.colleges,
    };
    const { inputs } = experimentInputs(original, {
      scenario: 'baseline',
      changes: { ...emptyChanges(), extraAid: [20000, 0] },
    });
    expect(simulate(inputs.colleges[0], inputs.assumptions).loanPrincipal).toBe(
      0,
    );
  });
  it('bounds effective inputs and reports every limit instead of hiding clipping', () => {
    const original = {
      colleges: [
        {
          ...defaults.colleges[0],
          startingSalary: 500000,
          scholarships: 300000,
        },
        defaults.colleges[1],
      ] as typeof defaults.colleges,
      assumptions: {
        ...defaults.assumptions,
        salaryGrowth: 0.2,
        expenseGrowth: -0.1,
        annualLivingExpenses: 0,
      },
    };
    const { inputs, limits } = experimentInputs(original, {
      scenario: 'optimistic',
      changes: {
        extraAid: [20000, 0],
        salaryChange: [0.2, 0],
        monthlyExpenseChange: -1000,
      },
    });
    expect(inputs.colleges[0].startingSalary).toBe(500000);
    expect(inputs.colleges[0].scholarships).toBe(300000);
    expect(inputs.assumptions.annualLivingExpenses).toBe(0);
    expect(inputs.assumptions.salaryGrowth).toBe(0.2);
    expect(inputs.assumptions.expenseGrowth).toBe(-0.1);
    expect(limits).toEqual([
      'College A aid',
      'College A salary',
      'Salary growth',
      'Expense growth',
      'Living expenses',
    ]);
  });
});
describe('Saved experiments', () => {
  it('round-trips valid changes and counts only nonzero adjustments', () => {
    const value = {
      scenario: 'conservative',
      changes: {
        extraAid: [5000, 0],
        salaryChange: [0, 0.1],
        monthlyExpenseChange: -50,
      },
    };
    expect(isExploration(JSON.parse(JSON.stringify(value)))).toBe(true);
    expect(changeCount(value.changes as ReturnType<typeof emptyChanges>)).toBe(
      3,
    );
    expect(changeCount(emptyChanges())).toBe(0);
  });
  it.each([
    null,
    {},
    { ...initialExploration(), scenario: 'unknown' },
    {
      ...initialExploration(),
      changes: { ...emptyChanges(), extraAid: [-1, 0] },
    },
    {
      ...initialExploration(),
      changes: { ...emptyChanges(), salaryChange: [0.21, 0] },
    },
    {
      ...initialExploration(),
      changes: { ...emptyChanges(), monthlyExpenseChange: Infinity },
    },
    { ...initialExploration(), changes: { ...emptyChanges(), extraAid: [0] } },
  ])('rejects malformed saved data: %j', (value) => {
    expect(isExploration(value)).toBe(false);
  });
  it('rejects invalid transformations before calculation', () => {
    expect(() =>
      experimentInputs(defaults, {
        scenario: 'baseline',
        changes: { ...emptyChanges(), monthlyExpenseChange: 1001 },
      }),
    ).toThrow(RangeError);
  });
});
