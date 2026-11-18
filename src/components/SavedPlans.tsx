import { useEffect, useId, useRef, useState } from 'react';
import { Bookmark, Pencil, Trash2 } from 'lucide-react';
import { isWorkspace } from '../state/defaults';
import {
  nameError,
  sameComparison,
  snapshot,
  type Comparison,
  type SavedPlan,
} from '../state/savedPlans';
import { useSavedPlans } from '../state/useSavedPlans';
import { Button } from './ui/button';
import './savedPlans.css';

export function SavedPlans({
  current,
  load,
}: {
  current: Comparison;
  load: (comparison: Comparison) => void;
}) {
  const { library, commit, error } = useSavedPlans();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [rename, setRename] = useState('');
  const [pending, setPending] = useState<{
    id: string;
    action: 'load' | 'delete';
  } | null>(null);
  const [message, setMessage] = useState('');
  const root = useRef<HTMLDetailsElement>(null);
  const id = useId();
  const active = library.plans.find((plan) => plan.id === library.activeId);
  const dirty = !!active && !sameComparison(current, active);
  const valid = isWorkspace(current.workspace);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        root.current?.querySelector('summary')?.focus();
      }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  function saveNew() {
    const problem = nameError(name, library.plans);
    if (problem) {
      setMessage(problem);
      return;
    }
    if (!valid) return;
    const plan = snapshot(current, crypto.randomUUID(), name, Date.now());
    if (
      commit({ ...library, plans: [...library.plans, plan], activeId: plan.id })
    ) {
      setName('');
      setMessage(`Saved “${plan.name}”.`);
      setPending(null);
    }
  }
  function loadPlan(plan: SavedPlan) {
    // Only apply the cloned snapshot after active-plan metadata is persisted.
    if (!commit({ ...library, activeId: plan.id })) return;
    load(
      structuredClone({
        workspace: plan.workspace,
        exploration: plan.exploration,
      }),
    );
    setPending(null);
    setEditing(null);
    setOpen(false);
    setMessage('');
    root.current?.querySelector('summary')?.focus();
  }
  return (
    <details className="saved-plans" ref={root} open={open}>
      <summary
        className="button button-outline button-sm"
        onClick={(event) => {
          event.preventDefault();
          setOpen(!open);
          setPending(null);
          setEditing(null);
          setMessage('');
        }}
      >
        <Bookmark size={14} aria-hidden="true" />
        {active ? (
          <span className="active-plan-name">
            {active.name}
            {dirty ? ' · Edited' : ''}
          </span>
        ) : (
          'Saved plans'
        )}
        <span className="plan-count">{library.plans.length}</span>
      </summary>
      <div className="plans-popover" aria-label="Saved plans">
        <header>
          <h2>Your plans</h2>
          <span>Stored on this browser</span>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveNew();
          }}
          className="plan-save-form"
        >
          <label htmlFor={`${id}-name`}>Save current comparison</label>
          <div>
            <input
              id={`${id}-name`}
              value={name}
              maxLength={60}
              placeholder="e.g. Computer science + scholarship"
              autoComplete="off"
              onChange={(event) => {
                setName(event.target.value);
                setMessage('');
              }}
            />
            <Button type="submit" size="sm" disabled={!valid || !name.trim()}>
              Save new
            </Button>
          </div>
        </form>
        {active && (
          <div className="plan-update">
            <span>
              {dirty
                ? 'Current plan has unsaved edits.'
                : 'Current plan is up to date.'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!dirty || !valid}
              onClick={() => {
                const next = snapshot(
                  current,
                  active.id,
                  active.name,
                  Date.now(),
                );
                if (
                  commit({
                    ...library,
                    plans: library.plans.map((plan) =>
                      plan.id === active.id ? next : plan,
                    ),
                  })
                ) {
                  setMessage(`Updated “${active.name}”.`);
                  setPending(null);
                }
              }}
            >
              Update saved
            </Button>
          </div>
        )}
        {!valid && (
          <p className="plan-message">
            Complete college names and valid inputs to save.
          </p>
        )}
        <div className="plan-list">
          {library.plans.length === 0 && (
            <p className="plan-empty">
              Keep different majors, offers or career paths here.
            </p>
          )}
          {library.plans.map((plan) => (
            <div
              className={`plan-item ${plan.id === active?.id ? 'current' : ''}`}
              key={plan.id}
            >
              {editing === plan.id ? (
                <form
                  className="plan-rename"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const problem = nameError(rename, library.plans, plan.id);
                    if (problem) {
                      setMessage(problem);
                      return;
                    }
                    if (
                      commit({
                        ...library,
                        plans: library.plans.map((item) =>
                          item.id === plan.id
                            ? { ...item, name: rename.trim() }
                            : item,
                        ),
                      })
                    ) {
                      setEditing(null);
                      setMessage('Plan renamed.');
                    }
                  }}
                >
                  <label className="sr-only" htmlFor={`${id}-rename`}>
                    New plan name
                  </label>
                  <input
                    id={`${id}-rename`}
                    autoFocus
                    maxLength={60}
                    value={rename}
                    onChange={(event) => setRename(event.target.value)}
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    className="plan-load"
                    aria-label={`Load ${plan.name}`}
                    title={plan.workspace.colleges
                      .map((college) => college.name)
                      .join(' / ')}
                    onClick={() => {
                      setEditing(null);
                      setMessage('');
                      if (sameComparison(current, plan)) loadPlan(plan);
                      else setPending({ id: plan.id, action: 'load' });
                    }}
                  >
                    <strong>{plan.name}</strong>
                    <small>
                      {plan.exploration.scenario}
                      {plan.id === active?.id
                        ? dirty
                          ? ' · Edited'
                          : ' · Current'
                        : ''}
                    </small>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Rename ${plan.name}`}
                    onClick={() => {
                      setEditing(plan.id);
                      setRename(plan.name);
                      setPending(null);
                      setMessage('');
                    }}
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${plan.name}`}
                    onClick={() => {
                      setPending({ id: plan.id, action: 'delete' });
                      setMessage('');
                    }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </>
              )}
              {pending?.id === plan.id && (
                <div className="plan-confirm">
                  <p>
                    {pending.action === 'load'
                      ? `Load “${plan.name}”? Current inputs and scenario will be replaced. Save a new plan first to keep your edits.`
                      : `Delete “${plan.name}”? You can restore it from Deleted plans. Your current comparison stays unchanged.`}
                  </p>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPending(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (pending.action === 'load') loadPlan(plan);
                        else if (
                          commit({
                            ...library,
                            plans: library.plans.filter(
                              (item) => item.id !== plan.id,
                            ),
                            deleted: [...(library.deleted ?? []), plan],
                            activeId:
                              library.activeId === plan.id
                                ? null
                                : library.activeId,
                          })
                        ) {
                          setPending(null);
                          setMessage('Plan deleted.');
                        }
                      }}
                    >
                      {pending.action === 'load' ? 'Load plan' : 'Delete plan'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {!!library.deleted?.length && (
          <details className="plan-recovery">
            <summary>Deleted plans ({library.deleted.length})</summary>
            {library.deleted.map((plan) => (
              <div key={plan.id}>
                <span>{plan.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Restore ${plan.name}`}
                  onClick={() => {
                    let restoredName = plan.name;
                    let suffix = 1;
                    while (nameError(restoredName, library.plans))
                      restoredName = `${plan.name.slice(0, 45)} (restored ${suffix++})`;
                    if (
                      commit({
                        ...library,
                        plans: [
                          ...library.plans,
                          { ...plan, name: restoredName },
                        ],
                        deleted: library.deleted?.filter(
                          (item) => item.id !== plan.id,
                        ),
                      })
                    )
                      setMessage(`Restored “${restoredName}”.`);
                  }}
                >
                  Restore
                </Button>
              </div>
            ))}
          </details>
        )}
        {(error || message) && (
          <p className="plan-message" role="status">
            {error || message}
          </p>
        )}
        <p className="plan-footnote">
          Includes all colleges, shared assumptions, scenario and quick
          adjustments. Changes to saved plans require “Update saved”.
        </p>
      </div>
    </details>
  );
}
