import type { SimulationInputs } from './types';
export type ScenarioId = 'conservative' | 'baseline' | 'optimistic';
export interface QuickChanges {
  extraAid: number[];
  salaryChange: number[];
  monthlyExpenseChange: number;
}
export interface Exploration {
  scenario: ScenarioId;
  changes: QuickChanges;
}
export const scenarios = [
  {
    id: 'conservative',
    label: 'Conservative',
    salary: -0.1,
    salaryGrowth: -0.01,
    expenses: 0.1,
    expenseGrowth: 0.01,
  },
  {
    id: 'baseline',
    label: 'Baseline',
    salary: 0,
    salaryGrowth: 0,
    expenses: 0,
    expenseGrowth: 0,
  },
  {
    id: 'optimistic',
    label: 'Optimistic',
    salary: 0.1,
    salaryGrowth: 0.01,
    expenses: -0.1,
    expenseGrowth: -0.01,
  },
] as const;
export const emptyChanges = (): QuickChanges => ({
  extraAid: [0, 0],
  salaryChange: [0, 0],
  monthlyExpenseChange: 0,
});
export const initialExploration = (): Exploration => ({
  scenario: 'baseline',
  changes: emptyChanges(),
});
export function changeCount(changes: QuickChanges) {
  return [
    ...changes.extraAid,
    ...changes.salaryChange,
    changes.monthlyExpenseChange,
  ].filter((v) => v !== 0).length;
}
export function isExploration(value: unknown): value is Exploration {
  if (!value || typeof value !== 'object') return false;
  const v = value as Exploration;
  const c = v.changes;
  const pair = (values: unknown, min: number, max: number) =>
    Array.isArray(values) &&
    values.length >= 2 &&
    values.length <= 4 &&
    values.every(
      (n) =>
        typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max,
    );
  return (
    scenarios.some((s) => s.id === v.scenario) &&
    !!c &&
    pair(c.extraAid, 0, 20000) &&
    pair(c.salaryChange, -0.2, 0.2) &&
    Number.isFinite(c.monthlyExpenseChange) &&
    c.monthlyExpenseChange >= -1000 &&
    c.monthlyExpenseChange <= 1000
  );
}
export function experimentInputs(
  original: SimulationInputs,
  exploration: Exploration,
): { inputs: SimulationInputs; limits: string[] } {
  if (!isExploration(exploration)) throw new RangeError('Invalid experiment');
  const scenario = scenarios.find((s) => s.id === exploration.scenario)!;
  const { changes } = exploration;
  const limits: string[] = [];
  function bounded(value: number, min: number, max: number, label: string) {
    const result = Math.min(max, Math.max(min, value));
    if (result !== value) limits.push(label);
    return result;
  }
  // Presets are always derived from the original inputs, never from the last selected preset.
  // Quick salary changes multiply the scenario-adjusted salary; expense changes are added afterward.
  const colleges = original.colleges.map((college, i) => ({
    ...college,
    scholarships: bounded(
      college.scholarships + (changes.extraAid[i] ?? 0),
      0,
      300000,
      `College ${'ABCD'[i]} aid`,
    ),
    startingSalary: bounded(
      college.startingSalary *
        (1 + scenario.salary) *
        (1 + (changes.salaryChange[i] ?? 0)),
      0,
      500000,
      `College ${'ABCD'[i]} salary`,
    ),
  })) as SimulationInputs['colleges'];
  const assumptions = {
    ...original.assumptions,
    salaryGrowth: bounded(
      original.assumptions.salaryGrowth + scenario.salaryGrowth,
      -0.1,
      0.2,
      'Salary growth',
    ),
    expenseGrowth: bounded(
      original.assumptions.expenseGrowth + scenario.expenseGrowth,
      -0.1,
      0.2,
      'Expense growth',
    ),
    annualLivingExpenses: bounded(
      original.assumptions.annualLivingExpenses * (1 + scenario.expenses) +
        changes.monthlyExpenseChange * 12,
      0,
      200000,
      'Living expenses',
    ),
  };
  return { inputs: { colleges, assumptions }, limits };
}
