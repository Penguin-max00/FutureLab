import type { College, FinancialAssumptions } from './types';
export function educationProjection(
  college: College,
  assumptions: Pick<
    FinancialAssumptions,
    'collegeCostGrowth' | 'inSchoolInterestRate'
  > = {},
) {
  const growth = assumptions.collegeCostGrowth ?? 0;
  const rate = assumptions.inSchoolInterestRate ?? 0;
  const amounts = [
    college.tuition,
    college.livingCost,
    college.scholarships,
    college.familyContribution,
  ];
  if (
    [assumptions.collegeCostGrowth, assumptions.inSchoolInterestRate].some(
      (value) => value !== undefined && typeof value !== 'number',
    ) ||
    amounts.some((value) => !Number.isFinite(value) || value < 0) ||
    !Number.isFinite(growth) ||
    growth < 0 ||
    growth > 0.2 ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 0.25 ||
    !Number.isInteger(college.yearsOfAttendance) ||
    college.yearsOfAttendance < 1 ||
    college.yearsOfAttendance > 8
  )
    throw new RangeError('Invalid college cost inputs');
  const annualNetCost = Math.max(
    0,
    college.tuition + college.livingCost - college.scholarships,
  );
  let totalCost = 0;
  let contribution = college.familyContribution;
  let interest = 0;
  const years = [];
  for (let year = 0; year < college.yearsOfAttendance; year++) {
    const net = Math.max(
      0,
      (college.tuition + college.livingCost) * (1 + growth) ** year -
        college.scholarships,
    );
    totalCost += net;
    const covered = Math.min(contribution, net);
    contribution -= covered;
    const borrowed = net - covered;
    years.push({ net, contribution: covered, borrowed });
    // One disbursement at each academic year's start. Accrue simple interest
    // on that principal only, then capitalize once at graduation.
    interest += borrowed * rate * (college.yearsOfAttendance - year);
  }
  // Keep legacy zero-growth results exactly, including their floating-point path.
  if (growth === 0) totalCost = annualNetCost * college.yearsOfAttendance;
  const borrowedPrincipal = Math.max(0, totalCost - college.familyContribution);
  const inSchoolInterest = Math.round((interest + Number.EPSILON) * 100) / 100;
  return {
    annualNetCost,
    years,
    totalCost,
    borrowedPrincipal,
    inSchoolInterest,
    loanPrincipal:
      inSchoolInterest === 0
        ? borrowedPrincipal
        : Math.round(
            (borrowedPrincipal + inSchoolInterest + Number.EPSILON) * 100,
          ) / 100,
  };
}
export function collegeCost(college: College) {
  const { annualNetCost, totalCost, loanPrincipal } =
    educationProjection(college);
  return { annualNetCost, totalCost, loanPrincipal };
}
