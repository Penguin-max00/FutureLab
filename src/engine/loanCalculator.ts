import type { LoanSchedule } from './types';
const cents = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export function calculateLoan(
  principal: number,
  annualRate: number,
  years: number,
): LoanSchedule {
  if (
    !Number.isFinite(principal) ||
    principal < 0 ||
    !Number.isFinite(annualRate) ||
    annualRate < 0 ||
    !Number.isInteger(years) ||
    years < 1 ||
    years > 50
  )
    throw new RangeError('Invalid loan assumptions');
  if (principal === 0)
    return { monthlyPayment: 0, totalInterest: 0, payments: [] };
  const months = years * 12;
  const rate = annualRate / 12;
  // Stable annuity formula, including rates close to zero.
  const monthlyPayment = cents(
    rate === 0
      ? principal / months
      : (principal * rate) / -Math.expm1(-months * Math.log1p(rate)),
  );
  let balance = cents(principal);
  const payments = [];
  let totalInterest = 0;
  for (let month = 1; month <= months && balance > 0; month++) {
    const interest = cents(balance * rate);
    // The last payment settles the cents left by monthly rounding.
    const payment =
      month === months
        ? cents(balance + interest)
        : Math.min(cents(balance + interest), monthlyPayment);
    const paidPrincipal = cents(payment - interest);
    balance = Math.max(0, cents(balance - paidPrincipal));
    totalInterest = cents(totalInterest + interest);
    payments.push({
      month,
      payment,
      interest,
      principal: paidPrincipal,
      balance,
    });
  }
  return { monthlyPayment, totalInterest, payments };
}
