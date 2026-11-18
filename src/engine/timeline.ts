import type { MonthlyFinancialSnapshot } from './types';
import type { educationProjection } from './collegeCost';

export function studyTimeline(
  cost: ReturnType<typeof educationProjection>,
  rate: number,
): MonthlyFinancialSnapshot[] {
  const start: MonthlyFinancialSnapshot = {
    month: 0,
    phase: 'studying',
    educationCost: 0,
    educationFunding: 0,
    grossIncome: 0,
    takeHomeIncome: 0,
    livingExpenses: 0,
    loanPayment: 0,
    accumulatedCash: 0,
    remainingLoanBalance: 0,
    netWorth: 0,
  };
  const months = [start];
  let principal = 0;
  let accrued = 0;
  for (let month = 1; month <= cost.years.length * 12; month++) {
    const year = cost.years[Math.floor((month - 1) / 12)];
    const disbursement = (month - 1) % 12 === 0;
    if (disbursement) principal += year.borrowed;
    accrued += (principal * rate) / 12;
    const debt =
      month === cost.years.length * 12
        ? cost.loanPrincipal
        : Math.round((principal + accrued + Number.EPSILON) * 100) / 100;
    months.push({
      ...start,
      month,
      educationCost: disbursement ? year.net : 0,
      educationFunding: disbursement ? year.net : 0,
      remainingLoanBalance: debt,
      netWorth: -debt,
    });
  }
  return months;
}
