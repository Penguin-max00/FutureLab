import { describe, expect, it } from 'vitest';
import { defaults } from './defaults';
import { initialExploration } from '../engine/experiments';
import {
  emptyLibrary,
  nameError,
  PLANS_KEY,
  readLibrary,
  sameComparison,
  snapshot,
} from './savedPlans';

const comparison = () => ({
  workspace: structuredClone(defaults),
  exploration: initialExploration(),
});
const read = (value: unknown) =>
  readLibrary({
    getItem: (key) => (key === PLANS_KEY ? JSON.stringify(value) : null),
  });

describe('saved comparison plans', () => {
  it('takes an independent snapshot of both colleges, assumptions and experiments', () => {
    const current = comparison();
    current.exploration.scenario = 'optimistic';
    current.exploration.changes.extraAid = [1200, 3000];
    current.exploration.changes.salaryChange = [0.1, -0.1];
    current.exploration.changes.monthlyExpenseChange = 150;
    const plan = snapshot(current, 'plan-a', '  My scholarship offer  ', 100);
    expect(plan.name).toBe('My scholarship offer');
    expect(sameComparison(current, plan)).toBe(true);
    current.workspace.colleges[0].startingSalary = 100000;
    current.workspace.assumptions.taxRate = 0.3;
    current.exploration.changes.extraAid[0] = 500;
    expect(plan.workspace.colleges[0].startingSalary).toBe(
      defaults.colleges[0].startingSalary,
    );
    expect(plan.workspace.assumptions.taxRate).toBe(
      defaults.assumptions.taxRate,
    );
    expect(plan.exploration.changes.extraAid[0]).toBe(1200);
    expect(sameComparison(current, plan)).toBe(false);
  });
  it('detects edits in every saved input category', () => {
    const original = comparison();
    const changes = [
      (next: ReturnType<typeof comparison>) => {
        next.workspace.colleges[1].name = 'Different major';
      },
      (next: ReturnType<typeof comparison>) => {
        next.workspace.colleges[1].tuition += 1;
      },
      (next: ReturnType<typeof comparison>) => {
        next.workspace.assumptions.repaymentYears += 1;
      },
      (next: ReturnType<typeof comparison>) => {
        next.exploration.scenario = 'conservative';
      },
      (next: ReturnType<typeof comparison>) => {
        next.exploration.changes.salaryChange[1] = 0.1;
      },
      (next: ReturnType<typeof comparison>) => {
        next.exploration.changes.extraAid[1] = 100;
      },
      (next: ReturnType<typeof comparison>) => {
        next.exploration.changes.monthlyExpenseChange = -100;
      },
    ];
    for (const change of changes) {
      const next = comparison();
      change(next);
      expect(sameComparison(original, next)).toBe(false);
    }
  });
  it('round trips multiple plans and ignores a stale active id', () => {
    const a = snapshot(comparison(), 'a', 'Offer A', 100);
    const next = comparison();
    next.workspace.colleges[1].startingSalary = 90000;
    const b = snapshot(next, 'b', 'Offer B', 200);
    const library = { version: 1, plans: [a, b], activeId: 'b' };
    expect(read(library)).toEqual(library);
    expect(read({ ...library, activeId: 'missing' }).activeId).toBeNull();
    expect(readLibrary(null)).toEqual(emptyLibrary());
  });
  it('rejects corrupted or unsupported storage instead of silently discarding plans', () => {
    const plan = snapshot(comparison(), 'a', 'Offer A', 100);
    for (const value of [
      { version: 2, plans: [] },
      { version: 1, plans: [plan, plan] },
      { version: 1, plans: [{ ...plan, workspace: {} }] },
      {
        version: 1,
        plans: [{ ...plan, exploration: { scenario: 'invented' } }],
      },
    ])
      expect(() => read(value)).toThrow();
    expect(() => readLibrary({ getItem: () => '{broken' })).toThrow();
    expect(() =>
      readLibrary({
        getItem: () => {
          throw new Error('Unavailable');
        },
      }),
    ).toThrow();
  });
  it('validates names without blocking a plan from retaining its own name', () => {
    const plan = snapshot(comparison(), 'a', 'My offer', 100);
    expect(nameError(' MY OFFER ', [plan])).toBeTruthy();
    expect(nameError('My offer', [plan], 'a')).toBeNull();
    expect(nameError(' ', [])).toBeTruthy();
    expect(nameError('x'.repeat(61), [])).toBeTruthy();
  });
  it('preserves deleted snapshots for recovery across reloads', () => {
    const plan = snapshot(comparison(), 'a', 'Recoverable offer', 100);
    const library = { version: 1, plans: [], activeId: null, deleted: [plan] };
    expect(read(library)).toEqual(library);
    expect(() => read({ ...library, plans: [plan] })).toThrow();
    expect(() => read({ ...library, deleted: [{}] })).toThrow();
  });
  it('rejects incomplete inputs and allows explicit zero amounts', () => {
    const current = comparison();
    current.workspace.colleges[0].name = '';
    expect(() => snapshot(current, 'a', 'Offer', 100)).toThrow();
    current.workspace.colleges[0].name = 'Zero tuition offer';
    current.workspace.colleges[0].tuition = 0;
    current.workspace.colleges[0].startingSalary = 0;
    expect(
      snapshot(current, 'a', 'Offer', 100).workspace.colleges[0].tuition,
    ).toBe(0);
  });
});
