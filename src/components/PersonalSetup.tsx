import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChartNoAxesCombined,
  Pencil,
} from 'lucide-react';
import {
  assumptionFields,
  assumptionHints,
  collegeFields,
  collegeFieldHints,
} from '../state/defaults';
import {
  completedDraft,
  newPersonalDraft,
  draftProgress,
  type DraftCollege,
  type PersonalDraft,
} from '../state/personalDraft';
import { Button } from './ui/button';
import { NumberField } from './NumberField';
import { CollegeCareerFinder } from './CollegeCareerFinder';
import { AdvancedAssumptions } from './AdvancedAssumptions';
const placeholders = {
  tuition: 'e.g. 14500',
  livingCost: 'e.g. 16000',
  scholarships: '0 if none',
  yearsOfAttendance: 'e.g. 4',
  familyContribution: '0 if none',
  startingSalary: 'e.g. 62000',
};
export function PersonalSetup({
  draft,
  update,
  cancel,
  complete,
  notice,
}: {
  draft: PersonalDraft;
  update: (draft: PersonalDraft) => void;
  cancel: () => void;
  complete: () => void;
  notice: string;
}) {
  const firstName = useRef<HTMLInputElement>(null);
  const [removeDraft, setRemoveDraft] = useState(false);
  const [salaryVersions, setSalaryVersions] = useState([0, 0, 0, 0]);
  const [invalidAssumptions, setInvalidAssumptions] = useState<Set<string>>(
    () => new Set(),
  );
  useEffect(() => {
    firstName.current?.focus({ preventScroll: true });
  }, []);
  const progress = draftProgress(draft);
  const ready = completedDraft(draft) !== null && invalidAssumptions.size === 0;
  function updateCollege(index: number, next: DraftCollege) {
    const colleges: PersonalDraft['colleges'] = [...draft.colleges];
    colleges[index] = next;
    update({ ...draft, colleges });
  }
  return (
    <main className="personal-setup">
      <header className="personal-header">
        <div>
          <span className="eyebrow">YOUR COLLEGES, YOUR FIGURES</span>
          <h1>Make it your comparison.</h1>
          <p>
            Fill in your colleges. Enter 0 when aid, a cost, or a contribution
            does not apply.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={cancel}>
          <ArrowLeft size={14} />
          Back to comparison
        </Button>
      </header>
      <div className="personal-layout">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (ready) complete();
          }}
        >
          <div className="personal-add-colleges">
            {draft.colleges.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!removeDraft) {
                    setRemoveDraft(true);
                    return;
                  }
                  const assumptions = { ...draft.assumptions };
                  const letter = 'ABCD'[draft.colleges.length - 1] as 'C' | 'D';
                  delete assumptions[`careerEvents${letter}`];
                  delete assumptions[`jobSearchMonths${letter}`];
                  update({
                    ...draft,
                    colleges: draft.colleges.slice(0, -1),
                    assumptions,
                  });
                  setRemoveDraft(false);
                }}
              >
                {removeDraft ? 'Confirm remove' : 'Remove'}{' '}
                {'ABCD'[draft.colleges.length - 1]}
              </Button>
            )}
            {draft.colleges.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRemoveDraft(false);
                  update({
                    ...draft,
                    colleges: [
                      ...draft.colleges,
                      {
                        ...newPersonalDraft(draft.assumptions).colleges[0],
                        id: crypto.randomUUID(),
                      },
                    ],
                  });
                }}
              >
                + Add college
              </Button>
            )}
          </div>
          <div className="college-grid">
            {draft.colleges.map((college, index) => (
              <article
                className={`college-panel college-${index} draft-college`}
                key={college.id}
              >
                <div className="college-heading">
                  <span className="college-letter">{'ABCD'[index]}</span>
                  <span>COLLEGE {'ABCD'[index]}</span>
                </div>
                <label className="sr-only" htmlFor={`draft-name-${index}`}>
                  College {'ABCD'[index]} name
                </label>
                <div className="college-name-wrap">
                  <input
                    ref={index === 0 ? firstName : undefined}
                    className="college-name"
                    id={`draft-name-${index}`}
                    placeholder="Enter college name"
                    value={college.name}
                    maxLength={80}
                    required
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) =>
                      updateCollege(index, {
                        ...college,
                        name: event.target.value,
                      })
                    }
                  />
                  <Pencil
                    size={13}
                    className="name-edit-icon"
                    aria-hidden="true"
                  />
                </div>
                <CollegeCareerFinder
                  name={college.name}
                  startingSalary={college.startingSalary}
                  index={index}
                  apply={(choice) => {
                    updateCollege(index, { ...college, ...choice });
                    if (choice.startingSalary !== undefined)
                      setSalaryVersions((versions) =>
                        versions.map((value, i) =>
                          i === index ? value + 1 : value,
                        ),
                      );
                  }}
                />
                <div className="draft-college-fields">
                  {collegeFields.map(([key, label, min, max, unit]) => (
                    <NumberField
                      key={
                        key === 'startingSalary'
                          ? `${key}-${salaryVersions[index]}`
                          : key
                      }
                      label={label}
                      value={college[key]}
                      min={min}
                      max={max}
                      unit={unit}
                      placeholder={placeholders[key]}
                      hint={collegeFieldHints[key]}
                      showHint
                      required
                      onChange={(value) =>
                        updateCollege(index, { ...college, [key]: value })
                      }
                      onEmpty={() =>
                        updateCollege(index, { ...college, [key]: null })
                      }
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
          <details className="draft-assumptions">
            <summary>
              Starting assumptions{' '}
              <span>
                {invalidAssumptions.size > 0
                  ? `${invalidAssumptions.size} fields need attention`
                  : 'Review & adjust'}
              </span>
            </summary>
            <p>
              These are starting estimates for all paths. Check your loan terms
              and choose assumptions that fit your situation.
            </p>
            <div className="assumptions-grid">
              {assumptionFields.map(([key, label, min, max, unit]) => (
                <NumberField
                  key={key}
                  label={label}
                  value={draft.assumptions[key]}
                  min={min}
                  max={max}
                  unit={unit}
                  hint={assumptionHints[key]}
                  showHint
                  onValidityChange={(valid) =>
                    setInvalidAssumptions((previous) => {
                      const next = new Set(previous);
                      if (valid) next.delete(key);
                      else next.add(key);
                      return next;
                    })
                  }
                  onChange={(value) =>
                    update({
                      ...draft,
                      assumptions: { ...draft.assumptions, [key]: value },
                    })
                  }
                />
              ))}
            </div>
            <AdvancedAssumptions
              attendanceYears={draft.colleges.map(
                (college) => college.yearsOfAttendance ?? 0,
              )}
              assumptions={draft.assumptions}
              update={(assumptions) => update({ ...draft, assumptions })}
              validity={(key, valid) =>
                setInvalidAssumptions((previous) => {
                  const next = new Set(previous);
                  if (valid) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
            />
          </details>
          <div className="personal-submit">
            <span>
              {invalidAssumptions.size > 0
                ? 'Review the highlighted assumptions to continue.'
                : ready
                  ? 'Ready to explore. You can edit everything later.'
                  : `${progress.total - progress.ready} fields left · zero is a valid answer when applicable.`}
            </span>
            <Button type="submit" disabled={!ready}>
              Compare my colleges
              <ArrowRight size={15} />
            </Button>
          </div>
        </form>
        <aside className="personal-preview" aria-label="Projection pending">
          <ChartNoAxesCombined size={25} />
          <h2>Your projection starts here.</h2>
          <p>
            Complete your colleges to see costs, loan payments, and life after
            graduation.
          </p>
          <progress
            value={progress.ready}
            max={progress.total}
            aria-label="College information completed"
          />
          <span className="draft-progress">
            {progress.ready} / {progress.total} fields ready
          </span>
          <small>No projection is calculated from empty fields.</small>
          <div className="draft-save-status">{notice} · draft</div>
        </aside>
      </div>
    </main>
  );
}
