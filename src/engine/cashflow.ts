// Effective annual growth compounded smoothly each month; year two begins at the annual multiplier.
export function monthlyAmount(
  annualAmount: number,
  annualGrowth: number,
  monthIndex: number,
) {
  return (annualAmount / 12) * (1 + annualGrowth) ** (monthIndex / 12);
}
