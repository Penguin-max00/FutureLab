import { useEffect, useMemo, useState } from 'react';
import {
  changeCount,
  emptyChanges,
  experimentInputs,
  initialExploration,
  isExploration,
  scenarios,
  type Exploration,
} from '../engine/experiments';
import { simulate } from '../engine/simulation';
import type { SimulationInputs, SimulationResult } from '../engine/types';
const KEY = 'futurelab.exploration.v1';
export function clearStoredExploration() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}
export function useExploration(original: SimulationInputs) {
  const [exploration, setExploration] = useState<Exploration>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isExploration(parsed)) return parsed;
      }
    } catch {
      /* Invalid or unavailable storage falls back to baseline. */
    }
    return initialExploration();
  });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(exploration));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [exploration]);
  const baseline = useMemo(
    () =>
      original.colleges.map((c, i) =>
        simulate(c, original.assumptions, i),
      ) as SimulationResult[],
    [original],
  );
  const outlooks = useMemo(
    () =>
      scenarios.map((scenario) => {
        const model = experimentInputs(original, {
          changes: exploration.changes,
          scenario: scenario.id,
        });
        return {
          ...scenario,
          ...model,
          results: model.inputs.colleges.map((c, i) =>
            simulate(c, model.inputs.assumptions, i),
          ) as SimulationResult[],
        };
      }),
    [original, exploration.changes],
  );
  const selected = outlooks.find((s) => s.id === exploration.scenario)!;
  const count = changeCount(exploration.changes);
  function clearAll() {
    setExploration(initialExploration());
  }
  function clearForExampleReset() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* The next mount still works in memory. */
    }
    clearAll();
  }
  return {
    exploration,
    setExploration,
    baseline,
    outlooks,
    selected,
    count,
    active: exploration.scenario !== 'baseline' || count > 0,
    storageError,
    clearAll,
    clearChanges: () =>
      setExploration((e) => ({ ...e, changes: emptyChanges() })),
    clearForExampleReset,
  };
}
export type ExplorerModel = ReturnType<typeof useExploration>;
