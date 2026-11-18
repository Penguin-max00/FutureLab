export interface College {
  id: string;
  name: string;
  tuition: number;
  livingCost: number;
  scholarships: number;
  yearsOfAttendance: number;
  familyContribution: number;
  startingSalary: number;
}
export interface FinancialAssumptions {
  timelineMode?: 'graduation' | 'enrollment';
  careerEventsA?: CareerEvent[];
  careerEventsB?: CareerEvent[];
  careerEventsC?: CareerEvent[];
  careerEventsD?: CareerEvent[];
  interestRate: number;
  repaymentYears: number;
  salaryGrowth: number;
  expenseGrowth: number;
  annualLivingExpenses: number;
  taxRate: number;
  horizonYears: number;
  jobSearchMonthsA?: number;
  jobSearchMonthsB?: number;
  jobSearchMonthsC?: number;
  jobSearchMonthsD?: number;
  collegeCostGrowth?: number;
  inSchoolInterestRate?: number;
}
export interface LoanPayment {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}
export type CareerEvent = { id: string; month: number } & (
  | { kind: 'raise'; change: number }
  | { kind: 'career-change'; annualSalary: number }
  | { kind: 'unemployment'; duration: number }
);
export interface LoanSchedule {
  monthlyPayment: number;
  totalInterest: number;
  payments: LoanPayment[];
}
export interface MonthlyFinancialSnapshot {
  phase?: 'studying' | 'job-search' | 'working' | 'unemployed';
  educationCost?: number;
  educationFunding?: number;
  month: number;
  grossIncome: number;
  takeHomeIncome: number;
  livingExpenses: number;
  loanPayment: number;
  accumulatedCash: number;
  remainingLoanBalance: number;
  netWorth: number;
}
export interface SimulationResult {
  timelineMode: 'graduation' | 'enrollment';
  graduationMonth: number;
  firstBudget: MonthlyFinancialSnapshot;
  annualNetCost: number;
  totalCost: number;
  loanPrincipal: number;
  borrowedPrincipal: number;
  inSchoolInterest: number;
  jobSearchMonths: number;
  loan: LoanSchedule;
  snapshots: MonthlyFinancialSnapshot[];
}
export interface SimulationInputs {
  colleges: College[];
  assumptions: FinancialAssumptions;
}
