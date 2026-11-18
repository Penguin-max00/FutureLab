import { describe, expect, it } from 'vitest';
import { defaults, isExampleWorkspace } from './defaults';
import {
  completedDraft,
  draftProgress,
  isPersonalDraft,
  newPersonalDraft,
} from './personalDraft';
import { loadWorkspaceSession } from './useWorkspace';
import { simulate } from '../engine/simulation';
const readStorage = (items: Record<string, unknown>) => ({
  getItem: (key: string) => (key in items ? JSON.stringify(items[key]) : null),
});
const completeExample = () => ({
  colleges: structuredClone(defaults.colleges),
  assumptions: { ...defaults.assumptions },
});
describe('Personal college drafts', () => {
  it('starts blank without converting missing amounts into zero', () => {
    const draft = newPersonalDraft(defaults.assumptions);
    expect(draft.colleges[0].name).toBe('');
    expect(draft.colleges[0].tuition).toBeNull();
    expect(draft.colleges[1].scholarships).toBeNull();
    expect(draftProgress(draft)).toEqual({ ready: 0, total: 14 });
    expect(completedDraft(draft)).toBeNull();
    expect(isPersonalDraft(draft)).toBe(true);
    expect(draft.assumptions).not.toBe(defaults.assumptions);
  });
  it('keeps an incomplete draft separate from the original comparison', () => {
    const before = structuredClone(defaults);
    const draft = newPersonalDraft(defaults.assumptions);
    draft.colleges[0].name = 'My college';
    draft.colleges[0].tuition = 12000;
    expect(draftProgress(draft)).toEqual({ ready: 2, total: 14 });
    expect(completedDraft(draft)).toBeNull();
    expect(defaults).toEqual(before);
  });
  it('requires every college field and both names before allowing simulation', () => {
    const draft = {
      ...completeExample(),
      colleges: [
        { ...defaults.colleges[0], startingSalary: null },
        { ...defaults.colleges[1] },
      ] as ReturnType<typeof newPersonalDraft>['colleges'],
    };
    expect(completedDraft(draft)).toBeNull();
    draft.colleges[0].startingSalary = 0;
    expect(completedDraft(draft)).not.toBeNull();
    draft.colleges[1].name = '  ';
    expect(completedDraft(draft)).toBeNull();
  });
  it('accepts explicit zero amounts without treating zero as missing', () => {
    const draft = newPersonalDraft({
      ...defaults.assumptions,
      annualLivingExpenses: 0,
    });
    for (const college of draft.colleges)
      Object.assign(college, {
        name: 'My college',
        tuition: 0,
        livingCost: 0,
        scholarships: 0,
        yearsOfAttendance: 4,
        familyContribution: 0,
        startingSalary: 0,
      });
    const complete = completedDraft(draft);
    expect(draftProgress(draft)).toEqual({ ready: 14, total: 14 });
    expect(complete).not.toBeNull();
    const result = simulate(complete!.colleges[0], complete!.assumptions);
    expect(result.totalCost).toBe(0);
    expect(result.loanPrincipal).toBe(0);
    expect(result.snapshots.at(-1)?.netWorth).toBe(0);
  });
  it('trims completed names and copies data before committing', () => {
    const draft = completeExample();
    draft.colleges[0].name = '  My University  ';
    const complete = completedDraft(draft)!;
    expect(complete.colleges[0].name).toBe('My University');
    complete.colleges[0].tuition = 1;
    expect(draft.colleges[0].tuition).toBe(defaults.colleges[0].tuition);
  });
  it.each([-1, NaN, '12000', undefined])(
    'rejects an invalid stored amount: %s',
    (tuition) => {
      const draft = completeExample();
      expect(
        isPersonalDraft({
          ...draft,
          colleges: [{ ...draft.colleges[0], tuition }, draft.colleges[1]],
        }),
      ).toBe(false);
    },
  );
  it('rejects invalid attendance and assumptions in a draft', () => {
    expect(
      isPersonalDraft({
        ...completeExample(),
        assumptions: { ...defaults.assumptions, taxRate: 2 },
      }),
    ).toBe(false);
    const draft = newPersonalDraft(defaults.assumptions);
    draft.colleges[0].yearsOfAttendance = 1.5;
    expect(isPersonalDraft(draft)).toBe(false);
  });
});
describe('Onboarding and existing saved data', () => {
  it('uses clearly named examples for new visitors', () => {
    const state = loadWorkspaceSession(null);
    expect(state.workspace.colleges.map((c) => c.name)).toEqual([
      'Example College A',
      'Example College B',
    ]);
    expect(state.guide.introDismissed).toBe(false);
  });
  it('only renames legacy examples when all financial inputs still match', () => {
    const legacy = completeExample();
    legacy.colleges[0].name = 'Lakeside State';
    legacy.colleges[1].name = 'Westbridge University';
    expect(isExampleWorkspace(legacy)).toBe(true);
    const migrated = loadWorkspaceSession(
      readStorage({ 'futurelab.workspace.v1': legacy }),
    );
    expect(migrated.workspace).toEqual(defaults);
    legacy.colleges[0].tuition = 13000;
    const personal = loadWorkspaceSession(
      readStorage({ 'futurelab.workspace.v1': legacy }),
    );
    expect(personal.workspace).toEqual(legacy);
    expect(personal.guide.introDismissed).toBe(true);
  });
  it('restores a partial draft alongside untouched existing inputs', () => {
    const original = completeExample();
    original.colleges[0].name = 'Saved University';
    const draft = newPersonalDraft(original.assumptions);
    draft.colleges[1].name = 'Next University';
    draft.colleges[1].scholarships = 0;
    const state = loadWorkspaceSession(
      readStorage({
        'futurelab.workspace.v1': original,
        'futurelab.personal-draft.v1': draft,
      }),
    );
    expect(state.workspace).toEqual(original);
    expect(state.draft).toEqual(draft);
    expect(completedDraft(state.draft!)).toBeNull();
  });
  it('restores dismissed guides without showing them on every visit', () => {
    const state = loadWorkspaceSession(
      readStorage({
        'futurelab.input-guide.v1': {
          introDismissed: true,
          hintDismissed: true,
        },
      }),
    );
    expect(state.guide).toEqual({ introDismissed: true, hintDismissed: true });
  });
  it('falls back safely when saved JSON or storage access is unavailable', () => {
    const broken = loadWorkspaceSession({ getItem: () => '{broken' });
    const blocked = loadWorkspaceSession({
      getItem: () => {
        throw new Error('Blocked');
      },
    });
    expect(broken.workspace).toEqual(defaults);
    expect(broken.draft).toBeNull();
    expect(blocked.workspace).toEqual(defaults);
  });
});
