import type { College, FinancialAssumptions } from '../engine/types';
import { validCareerAssumptions } from '../engine/careerEvents';
export interface Workspace {
  colleges: College[];
  assumptions: FinancialAssumptions;
}
export const defaults: Workspace = {
  colleges: [
    {
      id: 'a',
      name: 'Example College A',
      tuition: 14500,
      livingCost: 16000,
      scholarships: 6500,
      yearsOfAttendance: 4,
      familyContribution: 40000,
      startingSalary: 62000,
    },
    {
      id: 'b',
      name: 'Example College B',
      tuition: 42000,
      livingCost: 18000,
      scholarships: 24000,
      yearsOfAttendance: 4,
      familyContribution: 40000,
      startingSalary: 72000,
    },
  ],
  assumptions: {
    interestRate: 0.065,
    repaymentYears: 10,
    salaryGrowth: 0.03,
    expenseGrowth: 0.025,
    annualLivingExpenses: 30000,
    taxRate: 0.22,
    horizonYears: 15,
    jobSearchMonthsA: 0,
    jobSearchMonthsB: 0,
    collegeCostGrowth: 0,
    inSchoolInterestRate: 0,
  },
};
export const collegeFields = [
  ['tuition', 'Tuition & fees', 0, 200000, 'year'],
  ['livingCost', 'Housing & living', 0, 100000, 'year'],
  ['scholarships', 'Scholarships & grants', 0, 300000, 'year'],
  ['yearsOfAttendance', 'Years of attendance', 1, 8, 'years'],
  ['familyContribution', 'Family contribution & savings', 0, 2000000, 'total'],
  ['startingSalary', 'Starting salary', 0, 500000, 'year'],
] as const;
export const assumptionFields = [
  ['interestRate', 'Loan interest rate', 0, 0.25, '%'],
  ['repaymentYears', 'Repayment term', 1, 30, 'years'],
  ['salaryGrowth', 'Annual salary growth', -0.1, 0.2, '%'],
  ['expenseGrowth', 'Annual expense growth', -0.1, 0.2, '%'],
  [
    'annualLivingExpenses',
    'Living expenses after graduation',
    0,
    200000,
    'year',
  ],
  ['taxRate', 'Effective income tax rate', 0, 0.6, '%'],
  ['horizonYears', 'Simulation horizon', 1, 40, 'years'],
] as const;
export const advancedAssumptionFields = [
  ['jobSearchMonthsA', 'Job search · College A', 0, 60, 'months'],
  ['jobSearchMonthsB', 'Job search · College B', 0, 60, 'months'],
  ['jobSearchMonthsC', 'Job search · College C', 0, 60, 'months'],
  ['jobSearchMonthsD', 'Job search · College D', 0, 60, 'months'],
  ['collegeCostGrowth', 'Annual college cost growth', 0, 0.2, '%'],
  ['inSchoolInterestRate', 'In-school interest rate', 0, 0.25, '%'],
] as const;
export const advancedAssumptionHints = {
  jobSearchMonthsC:
    'Full months without salary after graduation for College C. Loan payments continue.',
  jobSearchMonthsD:
    'Full months without salary after graduation for College D. Loan payments continue.',
  jobSearchMonthsA:
    'Full months without salary after graduation for College A. Loan repayment and living costs continue.',
  jobSearchMonthsB:
    'Full months without salary after graduation for College B. Loan repayment and living costs continue.',
  collegeCostGrowth:
    'Annual growth of tuition and college living costs. Annual scholarships stay fixed.',
  inSchoolInterestRate:
    'Annual simple interest on borrowed principal during attendance; added to debt at graduation. Enter 0 to exclude it.',
};
export function validAdvancedAssumptions(assumptions: FinancialAssumptions) {
  return (
    validCareerAssumptions(assumptions) &&
    advancedAssumptionFields.every(([key, , min, max, unit]) => {
      const value = assumptions[key] ?? 0;
      return (
        (assumptions[key] === undefined ||
          typeof assumptions[key] === 'number') &&
        Number.isFinite(value) &&
        value >= min &&
        value <= max &&
        (unit !== 'months' || Number.isInteger(value))
      );
    })
  );
}
export function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false;
  const w = value as Workspace;
  return (
    Array.isArray(w.colleges) &&
    w.colleges.length >= 2 &&
    w.colleges.length <= 4 &&
    w.colleges.every(
      (c) =>
        c &&
        typeof c.name === 'string' &&
        c.name.trim().length > 0 &&
        c.name.length <= 80 &&
        typeof c.id === 'string' &&
        collegeFields.every(
          ([key, , min, max]) =>
            Number.isFinite(c[key]) &&
            c[key] >= min &&
            c[key] <= max &&
            (key !== 'yearsOfAttendance' || Number.isInteger(c[key])),
        ),
    ) &&
    !!w.assumptions &&
    validAdvancedAssumptions(w.assumptions) &&
    assumptionFields.every(
      ([key, , min, max, unit]) =>
        Number.isFinite(w.assumptions[key]) &&
        w.assumptions[key] >= min &&
        w.assumptions[key] <= max &&
        (unit !== 'years' || Number.isInteger(w.assumptions[key])),
    )
  );
}

export const collegeFieldHints: Record<
  (typeof collegeFields)[number][0],
  string
> = {
  tuition:
    'First-year tuition and mandatory fees. Advanced college cost growth applies in later years.',
  livingCost:
    'First-year college housing, food, transport, and personal costs.',
  scholarships:
    'Annual aid you do not repay, held fixed each year. Enter 0 if none.',
  yearsOfAttendance: 'Total years you expect to attend this college.',
  familyContribution:
    'Total available for the entire degree, not per year. Enter 0 if none.',
  startingSalary: 'Expected annual salary when work begins, before tax.',
};
export const assumptionHints: Record<
  (typeof assumptionFields)[number][0],
  string
> = {
  interestRate: 'Annual loan interest rate. Check your loan terms.',
  repaymentYears:
    'Years over which the loan is repaid with fixed monthly payments.',
  salaryGrowth:
    'Estimated effective annual salary growth, not a guaranteed raise.',
  expenseGrowth: 'Estimated effective annual growth in living expenses.',
  annualLivingExpenses:
    'Total living budget for the first year after graduation.',
  taxRate:
    'Estimated share of gross income paid as tax, not your marginal tax bracket.',
  horizonYears:
    'Years to explore from the selected timeline origin: enrollment or graduation.',
};
export function isExampleWorkspace(workspace: Workspace): boolean {
  const legacyNames = ['Lakeside State', 'Westbridge University'];
  return (
    workspace.colleges.length === 2 &&
    workspace.colleges.every(
      (college, i) =>
        (college.name === defaults.colleges[i].name ||
          college.name === legacyNames[i]) &&
        collegeFields.every(
          ([key]) => college[key] === defaults.colleges[i][key],
        ),
    ) &&
    (workspace.assumptions.timelineMode ?? 'graduation') === 'graduation' &&
    !(
      workspace.assumptions.careerEventsA?.length ||
      workspace.assumptions.careerEventsB?.length ||
      workspace.assumptions.careerEventsC?.length ||
      workspace.assumptions.careerEventsD?.length
    ) &&
    advancedAssumptionFields.every(
      ([key]) => (workspace.assumptions[key] ?? 0) === 0,
    ) &&
    assumptionFields.every(
      ([key]) => workspace.assumptions[key] === defaults.assumptions[key],
    )
  );
}
