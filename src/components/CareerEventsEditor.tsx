import { useId, useState } from 'react';
import type { CareerEvent, FinancialAssumptions } from '../engine/types';
import { isCareerEvents } from '../engine/careerEvents';
import { money } from '../lib/utils';
import { NumberField } from './NumberField';
import { Button } from './ui/button';
import './careerEvents.css';

export function CareerEventsEditor({
  assumptions,
  update,
  attendanceYears,
}: {
  assumptions: FinancialAssumptions;
  update: (next: FinancialAssumptions) => void;
  attendanceYears?: number[];
}) {
  const id = useId();
  const [college, setCollege] = useState<
    'careerEventsA' | 'careerEventsB' | 'careerEventsC' | 'careerEventsD'
  >('careerEventsA');
  const [kind, setKind] = useState<CareerEvent['kind']>('raise');
  const [month, setMonth] = useState(13);
  const [amount, setAmount] = useState(0.2);
  const [editing, setEditing] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [invalid, setInvalid] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState('');
  const events = assumptions[college] ?? [];
  const total =
    (assumptions.careerEventsA?.length ?? 0) +
    (assumptions.careerEventsB?.length ?? 0) +
    (assumptions.careerEventsC?.length ?? 0) +
    (assumptions.careerEventsD?.length ?? 0);
  function reset() {
    setEditing(null);
    setInvalid(new Set());
    setMessage('');
    setVersion((value) => value + 1);
  }
  function validity(key: string, valid: boolean) {
    setInvalid((previous) => {
      const next = new Set(previous);
      if (valid) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function save() {
    const common = { id: editing ?? crypto.randomUUID(), month };
    const event: CareerEvent =
      kind === 'raise'
        ? { ...common, kind, change: amount }
        : kind === 'career-change'
          ? { ...common, kind, annualSalary: amount }
          : { ...common, kind, duration: amount };
    const next = [...events.filter((item) => item.id !== editing), event].sort(
      (a, b) => a.month - b.month,
    );
    if (!isCareerEvents(next)) {
      setMessage(
        'Use one salary change per month and no more than 20 events per college.',
      );
      return;
    }
    update({ ...assumptions, [college]: next });
    reset();
    setMessage('Career event saved.');
  }
  return (
    <details className="career-events-editor">
      <summary>
        Career events <span>{total ? `${total} planned` : 'Optional'}</span>
      </summary>
      <p>
        Schedule months after graduation. Month 1 is the first month after
        graduation in either timeline view.
      </p>
      <div className="career-event-selectors">
        <label htmlFor={`${id}-college`}>
          College
          <select
            id={`${id}-college`}
            value={college}
            onChange={(event) => {
              setCollege(event.target.value as typeof college);
              reset();
            }}
          >
            {Array.from({ length: attendanceYears?.length ?? 2 }, (_, i) => (
              <option key={i} value={`careerEvents${'ABCD'[i]}`}>
                College {'ABCD'[i]}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${id}-kind`}>
          Event
          <select
            id={`${id}-kind`}
            value={kind}
            onChange={(event) => {
              const next = event.target.value as typeof kind;
              setKind(next);
              setAmount(
                next === 'raise' ? 0.2 : next === 'career-change' ? 70000 : 3,
              );
              setInvalid(new Set());
              setMessage('');
              setVersion((value) => value + 1);
            }}
          >
            <option value="raise">Promotion / pay change</option>
            <option value="career-change">Career change</option>
            <option value="unemployment">Unemployment</option>
          </select>
        </label>
      </div>
      <div className="assumptions-grid" key={version}>
        <NumberField
          label="Month after graduation"
          value={month}
          min={1}
          max={480}
          unit="months"
          onChange={setMonth}
          onValidityChange={(valid) => validity('month', valid)}
        />
        <NumberField
          label={
            kind === 'raise'
              ? 'Salary change'
              : kind === 'career-change'
                ? 'New annual salary'
                : 'Months without work'
          }
          value={amount}
          min={kind === 'raise' ? -0.8 : kind === 'career-change' ? 0 : 1}
          max={kind === 'raise' ? 2 : kind === 'career-change' ? 500000 : 60}
          unit={
            kind === 'raise'
              ? '%'
              : kind === 'career-change'
                ? 'year'
                : 'months'
          }
          onChange={setAmount}
          onValidityChange={(valid) => validity('amount', valid)}
        />
      </div>
      <div className="career-event-actions">
        {editing && (
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            Cancel edit
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={invalid.size > 0 || (!editing && events.length >= 20)}
          onClick={save}
        >
          {editing ? 'Update event' : 'Add event'}
        </Button>
      </div>
      <div className="career-event-list">
        {events.length === 0 && <p>No career events for this college.</p>}
        {events.map((event) => {
          const graduation =
            assumptions.timelineMode === 'enrollment'
              ? (attendanceYears?.['ABCD'.indexOf(college.slice(-1))] ?? 0) * 12
              : 0;
          const outside =
            event.month + graduation > assumptions.horizonYears * 12;
          return (
            <div key={event.id}>
              <span>
                <strong>
                  Month {event.month} ·{' '}
                  {event.kind === 'raise'
                    ? `Pay ${event.change >= 0 ? '+' : ''}${Number((event.change * 100).toFixed(2))}%`
                    : event.kind === 'career-change'
                      ? `Career change · ${money(event.annualSalary)} / yr`
                      : `Unemployment · ${event.duration} months`}
                </strong>
                {outside && <small>Outside the shown horizon</small>}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Edit event month ${event.month}`}
                onClick={() => {
                  reset();
                  setEditing(event.id);
                  setKind(event.kind);
                  setMonth(event.month);
                  setAmount(
                    event.kind === 'raise'
                      ? event.change
                      : event.kind === 'career-change'
                        ? event.annualSalary
                        : event.duration,
                  );
                }}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove event month ${event.month}`}
                onClick={() => {
                  update({
                    ...assumptions,
                    [college]: events.filter((item) => item.id !== event.id),
                  });
                  reset();
                }}
              >
                Remove
              </Button>
            </div>
          );
        })}
      </div>
      {message && <p role="status">{message}</p>}
      <p>
        Pay changes multiply the salary path from that month. A career change
        replaces it with a new annual salary and restarts growth. Unemployment
        pauses pay and salary growth; bills and loan payments continue.
        Overlapping unemployment periods merge. These are your assumptions, not
        predicted events.
      </p>
    </details>
  );
}
