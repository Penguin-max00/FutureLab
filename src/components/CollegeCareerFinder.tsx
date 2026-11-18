import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowUpRight, Search, X } from 'lucide-react';
import {
  careers,
  catalogCheckedOn,
  projectionPeriod,
  salaryAssumption,
  schools,
  searchSchools,
  wageYear,
  type CareerId,
  type CatalogSchool,
} from '../data/careerCatalog';
import { money } from '../lib/utils';
import { Button } from './ui/button';

export interface CollegeCareerChoice {
  name: string;
  startingSalary?: number;
}
export function CollegeCareerFinder({
  name,
  startingSalary,
  index,
  apply,
}: {
  name: string;
  startingSalary: number | null;
  index: number;
  apply: (choice: CollegeCareerChoice) => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <>
      <button
        type="button"
        className="career-entry"
        onClick={() => {
          setMessage('');
          setOpen(true);
        }}
      >
        <Search size={13} aria-hidden="true" /> College & career{' '}
        <ArrowUpRight size={12} aria-hidden="true" />
      </button>
      {message && (
        <span className="career-applied" role="status">
          {message}
        </span>
      )}
      {open &&
        createPortal(
          <CareerDialog
            name={name}
            startingSalary={startingSalary}
            index={index}
            close={() => setOpen(false)}
            apply={(choice) => {
              apply(choice);
              setMessage(
                choice.startingSalary === undefined
                  ? 'College name updated.'
                  : 'College name & salary updated.',
              );
              setOpen(false);
            }}
          />,
          document.body,
        )}
    </>
  );
}

function CareerDialog({
  name,
  startingSalary,
  index,
  close,
  apply,
}: {
  name: string;
  startingSalary: number | null;
  index: number;
  close: () => void;
  apply: (choice: CollegeCareerChoice) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const existingSchool = schools.find((school) => school.name === name);
  const [query, setQuery] = useState(existingSchool ? name : '');
  const [school, setSchool] = useState<CatalogSchool | null>(
    existingSchool ?? null,
  );
  const [programId, setProgramId] = useState('');
  const [careerId, setCareerId] = useState<CareerId | ''>('');
  const [salary, setSalary] = useState(
    startingSalary === null ? '' : String(startingSalary),
  );
  const program = school?.programs.find((entry) => entry.id === programId);
  const career =
    careerId && program?.careers.includes(careerId) ? careers[careerId] : null;
  const amount = salaryAssumption(salary);
  const matches = searchSchools(query);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    element
      ?.querySelector<HTMLInputElement | HTMLSelectElement>('input, select')
      ?.focus({ preventScroll: true });
    return () => element?.close();
  }, []);
  function chooseSchool(next: CatalogSchool) {
    setSchool(next);
    setProgramId('');
    setCareerId('');
  }
  return (
    <dialog
      ref={dialog}
      className="career-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-intro`}
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="career-dialog-inner">
        <header className="career-dialog-heading">
          <div>
            <span className="eyebrow">COLLEGE {'ABCD'[index]}</span>
            <h2 id={`${id}-title`}>A path after college.</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Close college & career"
            onClick={close}
          >
            <X size={18} />
          </Button>
        </header>
        <p id={`${id}-intro`} className="career-intro">
          Find a major. Explore a career. Choose your own starting salary.
        </p>
        {!school ? (
          <section className="career-school-search" aria-label="Find a college">
            <label htmlFor={`${id}-search`}>College name</label>
            <div className="career-search-wrap">
              <Search size={16} aria-hidden="true" />
              <input
                id={`${id}-search`}
                autoFocus
                type="search"
                placeholder="Try ASU, Penn State or UIUC"
                maxLength={100}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <p className="career-coverage">
              Starter collection · {schools.length} US colleges · selected
              majors
            </p>
            <div className="career-school-results" aria-live="polite">
              {matches.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  onClick={() => chooseSchool(entry)}
                >
                  <span>
                    <strong>{entry.name}</strong>
                    <small>{entry.location}</small>
                  </span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </button>
              ))}
              {matches.length === 0 && (
                <div className="career-no-results">
                  <strong>No match in this collection.</strong>
                  <p>
                    Your college may not be covered yet. Keep entering its name
                    and salary manually.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={close}
                  >
                    Back to manual inputs
                  </Button>
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            <div className="career-selected-school">
              <div>
                <strong>{school.name}</strong>
                <small>{school.location}</small>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSchool(null);
                  setQuery('');
                  setProgramId('');
                  setCareerId('');
                }}
              >
                <ArrowLeft size={12} /> Change
              </button>
            </div>
            <div className="career-pickers">
              <label htmlFor={`${id}-major`}>
                Explore a major
                <select
                  id={`${id}-major`}
                  autoFocus
                  value={programId}
                  onChange={(event) => {
                    const next = school.programs.find(
                      (entry) => entry.id === event.target.value,
                    );
                    setProgramId(event.target.value);
                    setCareerId(next?.careers[0] ?? '');
                  }}
                >
                  <option value="">Choose a major</option>
                  {school.programs.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </label>
              {program && (
                <label htmlFor={`${id}-career`}>
                  Possible career
                  <select
                    id={`${id}-career`}
                    value={careerId}
                    onChange={(event) =>
                      setCareerId(event.target.value as CareerId)
                    }
                  >
                    {program.careers.map((entry) => (
                      <option key={entry} value={entry}>
                        {careers[entry].name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {program && career && (
              <section
                className="career-reference"
                aria-label="Career reference"
              >
                <div className="career-facts">
                  <div>
                    <span>US median pay · {wageYear}</span>
                    <strong>
                      {money(career.median)}
                      <small> / yr</small>
                    </strong>
                  </div>
                  <div>
                    <span>Job growth · {projectionPeriod}</span>
                    <strong>+{career.growth}%</strong>
                  </div>
                </div>
                <p>
                  All experience levels; not a graduate starting salary or this
                  college’s earnings.
                </p>
                <div className="career-source-links">
                  <a href={program.source} target="_blank" rel="noreferrer">
                    College program <ArrowUpRight size={11} />
                  </a>
                  <a href={career.source} target="_blank" rel="noreferrer">
                    BLS career data <ArrowUpRight size={11} />
                  </a>
                </div>
                <label className="career-salary-label" htmlFor={`${id}-salary`}>
                  Your expected starting salary <span>gross · USD / year</span>
                </label>
                <div className="career-salary-wrap">
                  <span aria-hidden="true">$</span>
                  <input
                    id={`${id}-salary`}
                    type="number"
                    min={0}
                    max={500000}
                    step="any"
                    placeholder="Enter your estimate"
                    value={salary}
                    aria-invalid={salary !== '' && amount === null}
                    aria-describedby={`${id}-salary-help`}
                    onChange={(event) => setSalary(event.target.value)}
                  />
                </div>
                <small id={`${id}-salary-help`}>
                  {amount === null && salary !== ''
                    ? 'Enter an amount from $0 to $500,000.'
                    : 'Your estimate becomes the simulation’s starting salary.'}
                </small>
              </section>
            )}
            <footer className="career-actions">
              <Button
                type="button"
                size="sm"
                variant={career ? 'ghost' : 'default'}
                onClick={() => apply({ name: school.name })}
              >
                Use name only
              </Button>
              {career && (
                <Button
                  type="button"
                  size="sm"
                  disabled={amount === null}
                  onClick={() => {
                    if (amount !== null)
                      apply({ name: school.name, startingSalary: amount });
                  }}
                >
                  Apply name & salary
                </Button>
              )}
            </footer>
          </>
        )}
        <details className="career-data-notes">
          <summary>About these references</summary>
          <p>
            Local snapshot checked {catalogCheckedOn}; not a live search. Majors
            are verified offerings, not a quality ranking. Career links are
            illustrative paths, not placement rates or current job vacancies.
            National growth is not your chance of employment. School-specific
            graduate salary data is not included. Costs, aid and other
            assumptions stay as entered.
          </p>
        </details>
      </div>
    </dialog>
  );
}
