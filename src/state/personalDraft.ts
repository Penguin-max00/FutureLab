import type { College, FinancialAssumptions } from '../engine/types';
import {
  assumptionFields,
  collegeFields,
  isWorkspace,
  validAdvancedAssumptions,
  type Workspace,
} from './defaults';
export type DraftCollege = { id: string; name: string } & {
  [Key in Exclude<keyof College, 'id' | 'name'>]: number | null;
};
export interface PersonalDraft {
  colleges: DraftCollege[];
  assumptions: FinancialAssumptions;
}
export function newPersonalDraft(
  assumptions: FinancialAssumptions,
): PersonalDraft {
  const blank = (id: string): DraftCollege => ({
    id,
    name: '',
    tuition: null,
    livingCost: null,
    scholarships: null,
    yearsOfAttendance: null,
    familyContribution: null,
    startingSalary: null,
  });
  return {
    colleges: [blank('a'), blank('b')],
    assumptions: { ...assumptions },
  };
}
export function isPersonalDraft(value: unknown): value is PersonalDraft {
  if (!value || typeof value !== 'object') return false;
  const d = value as PersonalDraft;
  return (
    Array.isArray(d.colleges) &&
    d.colleges.length >= 2 &&
    d.colleges.length <= 4 &&
    d.colleges.every(
      (c) =>
        c &&
        typeof c.id === 'string' &&
        typeof c.name === 'string' &&
        c.name.length <= 80 &&
        collegeFields.every(
          ([key, , min, max]) =>
            c[key] === null ||
            (Number.isFinite(c[key]) &&
              c[key]! >= min &&
              c[key]! <= max &&
              (key !== 'yearsOfAttendance' || Number.isInteger(c[key]))),
        ),
    ) &&
    !!d.assumptions &&
    validAdvancedAssumptions(d.assumptions) &&
    assumptionFields.every(
      ([key, , min, max, unit]) =>
        Number.isFinite(d.assumptions[key]) &&
        d.assumptions[key] >= min &&
        d.assumptions[key] <= max &&
        (unit !== 'years' || Number.isInteger(d.assumptions[key])),
    )
  );
}
export function completedDraft(draft: PersonalDraft): Workspace | null {
  // Only validated, complete numbers cross the boundary into the financial engine.
  if (!isWorkspace(draft)) return null;
  return {
    ...structuredClone(draft),
    colleges: draft.colleges.map((c) => ({
      ...c,
      name: c.name.trim(),
    })) as Workspace['colleges'],
  };
}
export function draftProgress(draft: PersonalDraft) {
  const total = draft.colleges.length * (collegeFields.length + 1);
  const ready = draft.colleges.reduce(
    (count, c) =>
      count +
      Number(c.name.trim().length > 0) +
      collegeFields.filter(([key]) => c[key] !== null).length,
    0,
  );
  return { ready, total };
}
