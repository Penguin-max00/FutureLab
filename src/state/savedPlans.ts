import {
  assumptionFields,
  advancedAssumptionFields,
  collegeFields,
  isWorkspace,
  type Workspace,
} from './defaults';
import { isExploration, type Exploration } from '../engine/experiments';
import { canonicalEvents } from '../engine/careerEvents';

export const PLANS_KEY = 'futurelab.saved-plans.v1';
export interface Comparison {
  workspace: Workspace;
  exploration: Exploration;
}
export interface SavedPlan extends Comparison {
  id: string;
  name: string;
  updatedAt: number;
}
export interface PlanLibrary {
  version: 1;
  plans: SavedPlan[];
  activeId: string | null;
  deleted?: SavedPlan[];
}
export const emptyLibrary = (): PlanLibrary => ({
  version: 1,
  plans: [],
  activeId: null,
});
export function isSavedPlan(value: unknown): value is SavedPlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as SavedPlan;
  return (
    typeof plan.id === 'string' &&
    !!plan.id &&
    typeof plan.name === 'string' &&
    !!plan.name.trim() &&
    plan.name.length <= 60 &&
    Number.isFinite(plan.updatedAt) &&
    plan.updatedAt >= 0 &&
    isWorkspace(plan.workspace) &&
    isExploration(plan.exploration)
  );
}
export function readLibrary(
  storage: Pick<Storage, 'getItem'> | null,
): PlanLibrary {
  const raw = storage?.getItem(PLANS_KEY);
  if (!raw) return emptyLibrary();
  const value = JSON.parse(raw);
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.plans) ||
    !value.plans.every(isSavedPlan) ||
    new Set(value.plans.map((plan: SavedPlan) => plan.id)).size !==
      value.plans.length
  )
    throw new Error('Invalid plan library');
  if (
    value.deleted !== undefined &&
    (!Array.isArray(value.deleted) ||
      !value.deleted.every(isSavedPlan) ||
      new Set(
        [...value.plans, ...value.deleted].map((plan: SavedPlan) => plan.id),
      ).size !==
        value.plans.length + value.deleted.length)
  )
    throw new Error('Invalid deleted plans');
  return {
    version: 1,
    plans: value.plans,
    ...(value.deleted ? { deleted: value.deleted } : {}),
    activeId: value.plans.some((plan: SavedPlan) => plan.id === value.activeId)
      ? value.activeId
      : null,
  };
}
export function sameComparison(a: Comparison, b: Comparison): boolean {
  return (
    a.workspace.colleges.length === b.workspace.colleges.length &&
    a.workspace.colleges.every((college, i) => {
      const other = b.workspace.colleges[i];
      return (
        college.id === other.id &&
        college.name === other.name &&
        collegeFields.every(([key]) => college[key] === other[key])
      );
    }) &&
    assumptionFields.every(
      ([key]) => a.workspace.assumptions[key] === b.workspace.assumptions[key],
    ) &&
    advancedAssumptionFields.every(
      ([key]) =>
        (a.workspace.assumptions[key] ?? 0) ===
        (b.workspace.assumptions[key] ?? 0),
    ) &&
    (a.workspace.assumptions.timelineMode ?? 'graduation') ===
      (b.workspace.assumptions.timelineMode ?? 'graduation') &&
    JSON.stringify(canonicalEvents(a.workspace.assumptions.careerEventsA)) ===
      JSON.stringify(canonicalEvents(b.workspace.assumptions.careerEventsA)) &&
    JSON.stringify(canonicalEvents(a.workspace.assumptions.careerEventsB)) ===
      JSON.stringify(canonicalEvents(b.workspace.assumptions.careerEventsB)) &&
    JSON.stringify(canonicalEvents(a.workspace.assumptions.careerEventsC)) ===
      JSON.stringify(canonicalEvents(b.workspace.assumptions.careerEventsC)) &&
    JSON.stringify(canonicalEvents(a.workspace.assumptions.careerEventsD)) ===
      JSON.stringify(canonicalEvents(b.workspace.assumptions.careerEventsD)) &&
    a.exploration.scenario === b.exploration.scenario &&
    Array.from(
      {
        length: Math.max(
          a.exploration.changes.extraAid.length,
          b.exploration.changes.extraAid.length,
        ),
      },
      (_, i) => a.exploration.changes.extraAid[i] ?? 0,
    ).every((v, i) => v === (b.exploration.changes.extraAid[i] ?? 0)) &&
    Array.from(
      {
        length: Math.max(
          a.exploration.changes.salaryChange.length,
          b.exploration.changes.salaryChange.length,
        ),
      },
      (_, i) => a.exploration.changes.salaryChange[i] ?? 0,
    ).every((v, i) => v === (b.exploration.changes.salaryChange[i] ?? 0)) &&
    a.exploration.changes.monthlyExpenseChange ===
      b.exploration.changes.monthlyExpenseChange
  );
}
export function nameError(
  name: string,
  plans: SavedPlan[],
  ignoreId?: string,
): string | null {
  if (!name.trim()) return 'Give your plan a name.';
  if (name.trim().length > 60) return 'Use 60 characters or fewer.';
  if (
    plans.some(
      (plan) =>
        plan.id !== ignoreId &&
        plan.name.toLowerCase() === name.trim().toLowerCase(),
    )
  )
    return 'That name is already in use.';
  return null;
}
export function snapshot(
  comparison: Comparison,
  id: string,
  name: string,
  updatedAt: number,
): SavedPlan {
  const plan = structuredClone({
    ...comparison,
    id,
    name: name.trim(),
    updatedAt,
  });
  if (!isSavedPlan(plan))
    throw new Error('Complete the college inputs before saving.');
  return plan;
}
