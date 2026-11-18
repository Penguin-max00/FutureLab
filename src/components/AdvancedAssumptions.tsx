import type { FinancialAssumptions } from '../engine/types';
import {
  advancedAssumptionFields,
  advancedAssumptionHints,
} from '../state/defaults';
import { NumberField } from './NumberField';
import './advancedAssumptions.css';
import { useId } from 'react';
import { CareerEventsEditor } from './CareerEventsEditor';

export function AdvancedAssumptions({
  assumptions,
  update,
  validity,
  attendanceYears,
}: {
  assumptions: FinancialAssumptions;
  update: (assumptions: FinancialAssumptions) => void;
  validity?: (key: string, valid: boolean) => void;
  attendanceYears?: number[];
}) {
  const id = useId();
  return (
    <details className="advanced-assumptions">
      <summary>
        Advanced assumptions <span>Timeline, career & costs</span>
      </summary>
      <label className="timeline-setting" htmlFor={`${id}-timeline`}>
        Comparison timeline
        <select
          id={`${id}-timeline`}
          value={assumptions.timelineMode ?? 'graduation'}
          onChange={(event) =>
            update({
              ...assumptions,
              timelineMode: event.target.value as 'graduation' | 'enrollment',
            })
          }
        >
          <option value="enrollment">
            From enrollment · same starting point
          </option>
          <option value="graduation">After graduation · original view</option>
        </select>
      </label>
      <p>
        Loan repayment starts immediately after graduation, even while job
        searching.
      </p>
      <div className="assumptions-grid">
        {advancedAssumptionFields
          .filter(
            ([key]) =>
              (key !== 'jobSearchMonthsC' && key !== 'jobSearchMonthsD') ||
              (attendanceYears?.length ?? 2) >
                (key === 'jobSearchMonthsC' ? 2 : 3),
          )
          .map(([key, label, min, max, unit]) => (
            <NumberField
              key={key}
              label={label}
              value={assumptions[key] ?? 0}
              min={min}
              max={max}
              unit={unit}
              hint={advancedAssumptionHints[key]}
              showHint
              onValidityChange={(valid) => validity?.(key, valid)}
              onChange={(value) => update({ ...assumptions, [key]: value })}
            />
          ))}
      </div>
      <p>
        Tuition and college living costs grow yearly; scholarships stay fixed.
        Family funds cover the earliest costs. Borrowing is modeled at the start
        of each academic year. In-school simple interest is added once at
        graduation; the regular loan rate applies afterward. This is a custom
        assumption, not a specific loan program.
      </p>
      <CareerEventsEditor
        assumptions={assumptions}
        update={update}
        attendanceYears={attendanceYears}
      />
    </details>
  );
}
