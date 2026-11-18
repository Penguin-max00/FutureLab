import { useEffect, useState } from 'react';
import {
  defaults,
  isExampleWorkspace,
  isWorkspace,
  type Workspace,
} from './defaults';
import {
  completedDraft,
  isPersonalDraft,
  newPersonalDraft,
  type PersonalDraft,
} from './personalDraft';
const KEY = 'futurelab.workspace.v1';
const DRAFT_KEY = 'futurelab.personal-draft.v1';
const GUIDE_KEY = 'futurelab.input-guide.v1';
export function loadWorkspaceSession(storage: Pick<Storage, 'getItem'> | null) {
  let workspace = structuredClone(defaults);
  let draft: PersonalDraft | null = null;
  let guide = { introDismissed: false, hintDismissed: false };
  try {
    const raw = storage?.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isWorkspace(parsed))
        workspace = isExampleWorkspace(parsed)
          ? structuredClone(defaults)
          : parsed;
    }
  } catch {
    /* The workspace also works without browser storage. */
  }
  try {
    const raw = storage?.getItem(DRAFT_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isPersonalDraft(parsed)) draft = parsed;
    }
  } catch {
    /* Invalid drafts are ignored; originals remain untouched. */
  }
  try {
    const raw = storage?.getItem(GUIDE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.introDismissed === 'boolean' &&
        typeof parsed.hintDismissed === 'boolean'
      )
        guide = {
          introDismissed: parsed.introDismissed,
          hintDismissed: parsed.hintDismissed,
        };
    } else if (!isExampleWorkspace(workspace))
      guide = { introDismissed: true, hintDismissed: true };
  } catch {
    /* Guide state is optional. */
  }
  return { workspace, draft, guide };
}
export function useWorkspace() {
  const [initial] = useState(() => {
    try {
      return loadWorkspaceSession(localStorage);
    } catch {
      return loadWorkspaceSession(null);
    }
  });
  const [notice, setNotice] = useState('');
  const [workspace, setWorkspace] = useState<Workspace>(initial.workspace);
  const [draft, setDraft] = useState<PersonalDraft | null>(initial.draft);
  const [editingDraft, setEditingDraft] = useState(!!initial.draft);
  const [guide, setGuide] = useState(initial.guide);
  useEffect(() => {
    try {
      const originalSaved = isWorkspace(workspace);
      if (originalSaved) localStorage.setItem(KEY, JSON.stringify(workspace));
      if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      else localStorage.removeItem(DRAFT_KEY);
      localStorage.setItem(GUIDE_KEY, JSON.stringify(guide));
      setNotice(
        originalSaved
          ? 'Saved on this device'
          : 'Add college names to save changes',
      );
    } catch {
      setNotice('Storage unavailable · changes last for this session');
    }
  }, [workspace, draft, guide]);
  function startPersonal() {
    setDraft((previous) => previous ?? newPersonalDraft(workspace.assumptions));
    setEditingDraft(true);
    setGuide((g) => ({ ...g, introDismissed: true }));
  }
  function finishPersonal() {
    if (!draft) return false;
    const complete = completedDraft(draft);
    if (!complete) return false;
    setWorkspace(complete);
    setDraft(null);
    setEditingDraft(false);
    setGuide({ introDismissed: true, hintDismissed: true });
    return true;
  }
  return {
    workspace,
    setWorkspace,
    notice,
    draft,
    setDraft,
    editingDraft,
    startPersonal,
    finishPersonal,
    hasDraft: draft !== null,
    cancelPersonal: () => setEditingDraft(false),
    showIntro: !guide.introDismissed,
    showHint: !guide.hintDismissed,
    dismissIntro: () => setGuide((g) => ({ ...g, introDismissed: true })),
    dismissHint: () => setGuide((g) => ({ ...g, hintDismissed: true })),
    reset: () => {
      setWorkspace(structuredClone(defaults));
      setDraft(null);
      setEditingDraft(false);
      setGuide({ introDismissed: false, hintDismissed: false });
    },
  };
}
