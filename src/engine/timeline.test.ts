import { describe, expect, it } from 'vitest';
import { simulate } from './simulation';
import { defaults, isWorkspace, isExampleWorkspace } from '../state/defaults';
import { isCareerEvents } from './careerEvents';
import { experimentInputs, initialExploration } from './experiments';
import { readLibrary, sameComparison, snapshot } from '../state/savedPlans';
import type { CareerEvent } from './types';

const college = {
  ...defaults.colleges[0],
  tuition: 1000,
  livingCost: 0,
  scholarships: 0,
  familyContribution: 0,
  yearsOfAttendance: 2,
  startingSalary: 12000,
};
const assumptions = {
  ...defaults.assumptions,
  annualLivingExpenses: 0,
  taxRate: 0,
  interestRate: 0,
  salaryGrowth: 0,
  expenseGrowth: 0,
  horizonYears: 6,
};
describe('enrollment timeline', () => {
  it('compares different durations at the same elapsed month and includes earlier work', () => {
    const settings = { ...assumptions, timelineMode: 'enrollment' as const };
    const a = simulate(college, settings, 0);
    const b = simulate({ ...college, yearsOfAttendance: 4 }, settings, 1);
    expect(a.snapshots).toHaveLength(73);
    expect(b.snapshots).toHaveLength(73);
    expect(a.snapshots[24].phase).toBe('studying');
    expect(a.snapshots[25].grossIncome).toBe(1000);
    expect(b.snapshots[25].phase).toBe('studying');
    expect(b.snapshots[49].grossIncome).toBe(1000);
    expect(a.snapshots.at(-1)!.netWorth).toBeCloseTo(46000);
    expect(b.snapshots.at(-1)!.netWorth).toBeCloseTo(20000);
  });
  it('reconciles study borrowing, funding, simple interest and graduation debt', () => {
    const settings = {
      ...assumptions,
      collegeCostGrowth: 0.1,
      inSchoolInterestRate: 0.1,
    };
    const enrollment = simulate(college, {
      ...settings,
      timelineMode: 'enrollment',
    });
    const graduation = simulate(college, { ...settings, horizonYears: 4 });
    expect(enrollment.snapshots[0].netWorth).toBe(0);
    expect(enrollment.snapshots[1].remainingLoanBalance).toBeCloseTo(1008.33);
    expect(enrollment.snapshots[24].remainingLoanBalance).toBe(
      graduation.loanPrincipal,
    );
    expect(enrollment.snapshots[24].remainingLoanBalance).toBe(2410);
    for (const month of enrollment.snapshots.slice(0, 25)) {
      expect(month.educationFunding).toBe(month.educationCost);
      expect(month.accumulatedCash).toBe(0);
      expect(month.netWorth).toBeCloseTo(-month.remainingLoanBalance);
    }
    expect(enrollment.snapshots[25]).toEqual({
      ...graduation.snapshots[1],
      month: 25,
    });
    expect(enrollment.firstBudget).toEqual(graduation.firstBudget);
  });
  it('handles a horizon ending before graduation without inventing earned income', () => {
    const result = simulate(
      { ...college, yearsOfAttendance: 4 },
      { ...assumptions, horizonYears: 1, timelineMode: 'enrollment' },
    );
    expect(result.snapshots).toHaveLength(13);
    expect(result.snapshots.every((month) => month.grossIncome === 0)).toBe(
      true,
    );
    expect(result.snapshots.at(-1)!.remainingLoanBalance).toBe(1000);
    expect(result.loanPrincipal).toBe(4000);
    expect(result.firstBudget.grossIncome).toBe(1000);
    expect(result.graduationMonth).toBe(48);
  });
  it('preserves original results for missing versus explicit original settings', () => {
    expect(simulate(college, assumptions)).toEqual(
      simulate(college, {
        ...assumptions,
        timelineMode: 'graduation',
        careerEventsA: [],
        careerEventsB: [],
      }),
    );
  });
});
describe('career event cash flows', () => {
  it('applies a pay change at the exact month and keeps the changed salary path', () => {
    const result = simulate(college, {
      ...assumptions,
      careerEventsA: [{ id: 'raise', month: 13, kind: 'raise', change: 0.2 }],
    });
    expect(result.snapshots[12].grossIncome).toBe(1000);
    expect(result.snapshots[13].grossIncome).toBe(1200);
    expect(result.snapshots[25].grossIncome).toBe(1200);
  });
  it('resets salary and growth on a career change', () => {
    const result = simulate(college, {
      ...assumptions,
      salaryGrowth: 0.12,
      careerEventsA: [
        { id: 'change', month: 13, kind: 'career-change', annualSalary: 24000 },
      ],
    });
    expect(result.snapshots[13].grossIncome).toBe(2000);
    expect(result.snapshots[25].grossIncome).toBeCloseTo(2240);
  });
  it('merges unemployment periods, pauses salary growth, and continues bills', () => {
    const result = simulate(college, {
      ...assumptions,
      salaryGrowth: 0.12,
      annualLivingExpenses: 1200,
      careerEventsA: [
        { id: 'gap1', month: 13, kind: 'unemployment', duration: 3 },
        { id: 'gap2', month: 15, kind: 'unemployment', duration: 3 },
      ],
    });
    expect(
      result.snapshots
        .slice(13, 18)
        .every(
          (month) =>
            month.grossIncome === 0 &&
            month.phase === 'unemployed' &&
            month.livingExpenses === 100 &&
            month.loanPayment > 0,
        ),
    ).toBe(true);
    expect(result.snapshots[18].grossIncome).toBeCloseTo(1120);
    expect(result.snapshots[17].accumulatedCash).toBeLessThan(
      result.snapshots[12].accumulatedCash,
    );
  });
  it('honors salary changes while unemployed, beginning the new salary when work resumes', () => {
    const result = simulate(college, {
      ...assumptions,
      jobSearchMonthsA: 2,
      careerEventsA: [
        { id: 'gap', month: 3, kind: 'unemployment', duration: 2 },
        { id: 'change', month: 4, kind: 'career-change', annualSalary: 36000 },
      ],
    });
    expect(
      result.snapshots.slice(1, 5).every((month) => month.grossIncome === 0),
    ).toBe(true);
    expect(result.snapshots[5].grossIncome).toBe(3000);
  });
  it('keeps college-specific events, saved plans and scenario transforms independent', () => {
    const workspace = structuredClone(defaults);
    workspace.assumptions.timelineMode = 'enrollment';
    workspace.assumptions.careerEventsB = [
      { id: 'b', month: 1, kind: 'career-change', annualSalary: 96000 },
    ];
    const exploration = initialExploration();
    const plan = snapshot({ workspace, exploration }, 'plan', 'Career', 1);
    expect(sameComparison(plan, { workspace: defaults, exploration })).toBe(
      false,
    );
    const saved = readLibrary({
      getItem: () =>
        JSON.stringify({ version: 1, plans: [plan], activeId: 'plan' }),
    }).plans[0];
    expect(saved.workspace.assumptions.careerEventsB).toEqual(
      workspace.assumptions.careerEventsB,
    );
    const transformed = experimentInputs(workspace, {
      ...exploration,
      scenario: 'optimistic',
    });
    expect(
      simulate(workspace.colleges[1], transformed.inputs.assumptions, 1)
        .firstBudget.grossIncome,
    ).toBe(8000);
    expect(
      simulate(workspace.colleges[0], transformed.inputs.assumptions, 0)
        .firstBudget.grossIncome,
    ).not.toBe(8000);
    workspace.assumptions.careerEventsB[0].month = 2;
    expect(saved.workspace.assumptions.careerEventsB![0].month).toBe(1);
    expect(isExampleWorkspace(workspace)).toBe(false);
  });
  it('rejects invalid timings, salary values, duplicate events and ambiguous salary changes', () => {
    const raise: CareerEvent = {
      id: 'raise',
      month: 1,
      kind: 'raise',
      change: 0.2,
    };
    for (const events of [
      [{ ...raise, month: 0 }],
      [{ ...raise, month: 1.5 }],
      [{ ...raise, change: Infinity }],
      [raise, raise],
      [
        raise,
        { id: 'other', month: 1, kind: 'career-change', annualSalary: 20000 },
      ],
      [{ id: 'gap', month: 1, kind: 'unemployment', duration: 0 }],
    ])
      expect(isCareerEvents(events)).toBe(false);
    expect(
      isWorkspace({
        ...defaults,
        assumptions: { ...assumptions, careerEventsA: [{}] },
      }),
    ).toBe(false);
    expect(() =>
      simulate(college, {
        ...assumptions,
        timelineMode: 'bad' as 'enrollment',
      }),
    ).toThrow();
  });
});
