import type { CareerEvent, FinancialAssumptions } from './types';
export function isCareerEvents(value: unknown): value is CareerEvent[] {
  if (!Array.isArray(value) || value.length > 20) return false;
  const ids = new Set<string>();
  const salaryMonths = new Set<number>();
  return value.every((event) => {
    if (
      !event ||
      typeof event !== 'object' ||
      typeof event.id !== 'string' ||
      !event.id ||
      ids.has(event.id) ||
      !Number.isInteger(event.month) ||
      event.month < 1 ||
      event.month > 480
    )
      return false;
    ids.add(event.id);
    if (event.kind !== 'unemployment') {
      if (salaryMonths.has(event.month)) return false;
      salaryMonths.add(event.month);
    }
    if (event.kind === 'raise')
      return (
        typeof event.change === 'number' &&
        Number.isFinite(event.change) &&
        event.change >= -0.8 &&
        event.change <= 2
      );
    if (event.kind === 'career-change')
      return (
        typeof event.annualSalary === 'number' &&
        Number.isFinite(event.annualSalary) &&
        event.annualSalary >= 0 &&
        event.annualSalary <= 500000
      );
    if (event.kind === 'unemployment')
      return (
        Number.isInteger(event.duration) &&
        event.duration >= 1 &&
        event.duration <= 60
      );
    return false;
  });
}
export function validCareerAssumptions(assumptions: FinancialAssumptions) {
  return (
    (assumptions.timelineMode === undefined ||
      assumptions.timelineMode === 'graduation' ||
      assumptions.timelineMode === 'enrollment') &&
    (assumptions.careerEventsA === undefined ||
      isCareerEvents(assumptions.careerEventsA)) &&
    (assumptions.careerEventsC === undefined ||
      isCareerEvents(assumptions.careerEventsC)) &&
    (assumptions.careerEventsD === undefined ||
      isCareerEvents(assumptions.careerEventsD)) &&
    (assumptions.careerEventsB === undefined ||
      isCareerEvents(assumptions.careerEventsB))
  );
}
export function canonicalEvents(events: CareerEvent[] = []) {
  return [...events]
    .sort((a, b) => a.month - b.month || a.id.localeCompare(b.id))
    .map((event) =>
      event.kind === 'raise'
        ? [event.id, event.month, event.kind, event.change]
        : event.kind === 'career-change'
          ? [event.id, event.month, event.kind, event.annualSalary]
          : [event.id, event.month, event.kind, event.duration],
    );
}
