import { useState } from 'react';
import {
  emptyLibrary,
  PLANS_KEY,
  readLibrary,
  type PlanLibrary,
} from './savedPlans';

export function useSavedPlans() {
  const [initial] = useState(() => {
    try {
      return { library: readLibrary(localStorage), error: '' };
    } catch {
      return {
        library: emptyLibrary(),
        error:
          'Saved plans could not be read. Existing storage has not been changed.',
      };
    }
  });
  const [library, setLibrary] = useState(initial.library);
  const [error, setError] = useState(initial.error);
  function commit(next: PlanLibrary) {
    if (initial.error) {
      setError(
        'Saved plans could not be read. Reload when storage is available; existing data will not be overwritten.',
      );
      return false;
    }
    try {
      localStorage.setItem(PLANS_KEY, JSON.stringify(next));
      setError('');
      setLibrary(next);
      return true;
    } catch {
      setError(
        'Could not save on this device. Your saved plans have not been changed.',
      );
      return false;
    }
  }
  return { library, commit, error };
}
