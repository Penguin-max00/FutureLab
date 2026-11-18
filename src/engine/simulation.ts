import { educationProjection } from './collegeCost';
import { calculateLoan } from './loanCalculator';
import { monthlyAmount } from './cashflow';
import { validCareerAssumptions } from './careerEvents';
import { studyTimeline } from './timeline';
import type {
  College,
  FinancialAssumptions,
  MonthlyFinancialSnapshot,
  SimulationResult,
} from './types';
export function simulate(
  college: College,
  assumptions: FinancialAssumptions,
  collegeIndex = 0,
): SimulationResult {
  const jobSearchMonths =
    [
      assumptions.jobSearchMonthsA,
      assumptions.jobSearchMonthsB,
      assumptions.jobSearchMonthsC,
      assumptions.jobSearchMonthsD,
    ][collegeIndex] ?? 0;
  if (
    !validCareerAssumptions(assumptions) ||
    [
      assumptions.jobSearchMonthsA,
      assumptions.jobSearchMonthsB,
      assumptions.jobSearchMonthsC,
      assumptions.jobSearchMonthsD,
    ].some(
      (value) =>
        value !== undefined &&
        (typeof value !== 'number' ||
          !Number.isInteger(value) ||
          value < 0 ||
          value > 60),
    ) ||
    ![0, 1, 2, 3].includes(collegeIndex) ||
    !Number.isInteger(jobSearchMonths) ||
    jobSearchMonths < 0 ||
    jobSearchMonths > 60 ||
    !Number.isFinite(college.startingSalary) ||
    college.startingSalary < 0 ||
    !Number.isFinite(assumptions.annualLivingExpenses) ||
    assumptions.annualLivingExpenses < 0 ||
    !Number.isFinite(assumptions.taxRate) ||
    assumptions.taxRate < 0 ||
    assumptions.taxRate > 1 ||
    !Number.isInteger(assumptions.horizonYears) ||
    assumptions.horizonYears < 1 ||
    assumptions.horizonYears > 40 ||
    [assumptions.salaryGrowth, assumptions.expenseGrowth].some(
      (rate) => !Number.isFinite(rate) || rate <= -1 || rate > 1,
    )
  )
    throw new RangeError('Invalid simulation assumptions');
  const cost = educationProjection(college, assumptions);
  const loan = calculateLoan(
    cost.loanPrincipal,
    assumptions.interestRate,
    assumptions.repaymentYears,
  );
  let accumulatedCash = 0;
  const timelineMode = assumptions.timelineMode ?? 'graduation';
  const graduationMonth =
    timelineMode === 'enrollment' ? college.yearsOfAttendance * 12 : 0;
  const events =
    [
      assumptions.careerEventsA,
      assumptions.careerEventsB,
      assumptions.careerEventsC,
      assumptions.careerEventsD,
    ][collegeIndex] ?? [];
  const horizonMonths = assumptions.horizonYears * 12;
  const postGradMonths =
    timelineMode === 'enrollment'
      ? Math.max(1, horizonMonths - graduationMonth)
      : horizonMonths;
  let salary = college.startingSalary;
  let workingMonths = 0;
  const snapshots: MonthlyFinancialSnapshot[] = [
    {
      month: 0,
      grossIncome: 0,
      takeHomeIncome: 0,
      livingExpenses: 0,
      loanPayment: 0,
      accumulatedCash: 0,
      remainingLoanBalance: cost.loanPrincipal,
      netWorth: -cost.loanPrincipal,
    },
  ];
  for (let month = 1; month <= postGradMonths; month++) {
    for (const event of events.filter((event) => event.month === month)) {
      if (event.kind === 'raise') salary *= 1 + event.change;
      if (event.kind === 'career-change') {
        salary = event.annualSalary;
        workingMonths = 0;
      }
    }
    const unemployed = events.some(
      (event) =>
        event.kind === 'unemployment' &&
        month >= event.month &&
        month < event.month + event.duration,
    );
    const phase =
      month <= jobSearchMonths
        ? 'job-search'
        : unemployed
          ? 'unemployed'
          : 'working';
    const grossIncome =
      phase !== 'working'
        ? 0
        : monthlyAmount(salary, assumptions.salaryGrowth, workingMonths);
    if (phase === 'working') workingMonths++;
    const takeHomeIncome = grossIncome * (1 - assumptions.taxRate);
    const livingExpenses = monthlyAmount(
      assumptions.annualLivingExpenses,
      assumptions.expenseGrowth,
      month - 1,
    );
    const loanPayment = loan.payments[month - 1]?.payment ?? 0;
    const remainingLoanBalance = loan.payments[month - 1]?.balance ?? 0;
    accumulatedCash += takeHomeIncome - livingExpenses - loanPayment;
    snapshots.push({
      month,
      phase,
      grossIncome,
      takeHomeIncome,
      livingExpenses,
      loanPayment,
      accumulatedCash,
      remainingLoanBalance,
      netWorth: accumulatedCash - remainingLoanBalance,
    });
  }
  const firstBudget = snapshots[1];
  const chartSnapshots =
    timelineMode === 'graduation'
      ? snapshots
      : [
          ...studyTimeline(cost, assumptions.inSchoolInterestRate ?? 0),
          ...snapshots.slice(1).map((snapshot) => ({
            ...snapshot,
            month: graduationMonth + snapshot.month,
          })),
        ].slice(0, horizonMonths + 1);
  return {
    ...cost,
    timelineMode,
    graduationMonth,
    firstBudget,
    jobSearchMonths,
    loan,
    snapshots: chartSnapshots,
  };
}
