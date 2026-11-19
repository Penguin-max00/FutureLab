import { simulate } from './simulation';
import type { FinancialAssumptions } from './types';

export interface QuickInputs {
  debtA: number | null;
  salaryA: number | null;
  debtB: number | null;
  salaryB: number | null;
  monthlyLiving: number | null;
}

export const quickDefaults: QuickInputs = {
  debtA: 56000,
  salaryA: 62000,
  debtB: 104000,
  salaryB: 72000,
  monthlyLiving: 2500,
};

export const quickLimits = {
  debtA: 2000000,
  salaryA: 500000,
  debtB: 2000000,
  salaryB: 500000,
  monthlyLiving: 25000,
} as const;

// A separate, fixed model: advanced workspace settings never leak into this view.
const quickAssumptions: FinancialAssumptions = {
  timelineMode: 'graduation',
  interestRate: 0.065,
  repaymentYears: 10,
  taxRate: 0.22,
  salaryGrowth: 0.03,
  expenseGrowth: 0.025,
  annualLivingExpenses: 0,
  horizonYears: 10,
};

export function isQuickInputs(value: unknown): value is QuickInputs {
  if (!value || typeof value !== 'object') return false;
  const fields = value as Record<string, unknown>;
  return Object.entries(quickLimits).every(([key, max]) => {
    const amount = fields[key];
    return (
      amount === null ||
      (typeof amount === 'number' &&
        Number.isFinite(amount) &&
        amount >= 0 &&
        amount <= max)
    );
  });
}

export function estimateQuick(inputs: QuickInputs) {
  if (!isQuickInputs(inputs) || Object.values(inputs).some((v) => v === null))
    return null;
  return (['A', 'B'] as const).map((letter, index) =>
    simulate(
      {
        id: `quick-${letter.toLowerCase()}`,
        name: `College ${letter}`,
        // The cost is already the user's total borrowing at graduation.
        tuition: inputs[`debt${letter}`]!,
        livingCost: 0,
        scholarships: 0,
        yearsOfAttendance: 1,
        familyContribution: 0,
        startingSalary: inputs[`salary${letter}`]!,
      },
      {
        ...quickAssumptions,
        annualLivingExpenses: inputs.monthlyLiving! * 12,
      },
      index,
    ),
  );
}
