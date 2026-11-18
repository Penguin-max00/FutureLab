import { GraduationCap, Pencil } from 'lucide-react';
import { useState } from 'react';
import type { College } from '../engine/types';
import { collegeFields, collegeFieldHints } from '../state/defaults';
import { NumberField } from './NumberField';
import { collegeCost } from '../engine/collegeCost';
import { money } from '../lib/utils';
import { CollegeCareerFinder } from './CollegeCareerFinder';
export function CollegeEditor({
  college,
  index,
  update,
  example = false,
}: {
  college: College;
  index: number;
  update: (college: College) => void;
  example?: boolean;
}) {
  const [salaryVersion, setSalaryVersion] = useState(0);
  return (
    <article className={`college-panel college-${index}`}>
      <div className="college-heading">
        <span className="college-letter">{'ABCD'[index]}</span>
        <span>COLLEGE {'ABCD'[index]}</span>
        {example && <span className="example-badge">EXAMPLE</span>}
        <GraduationCap size={18} />
      </div>
      <label className="sr-only" htmlFor={`college-name-${index}`}>
        College {'ABCD'[index]} name
      </label>
      <div className="college-name-wrap">
        <input
          className="college-name"
          id={`college-name-${index}`}
          value={college.name}
          maxLength={80}
          title="Click to rename this college"
          placeholder="Enter college name"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => update({ ...college, name: e.target.value })}
          onBlur={() => {
            if (!college.name.trim())
              update({
                ...college,
                name: `College ${'ABCD'[index]}`,
              });
          }}
        />
        <Pencil size={13} className="name-edit-icon" aria-hidden="true" />
      </div>
      <CollegeCareerFinder
        name={college.name}
        startingSalary={college.startingSalary}
        index={index}
        apply={(choice) => {
          update({ ...college, ...choice });
          if (choice.startingSalary !== undefined)
            setSalaryVersion((v) => v + 1);
        }}
      />
      <div className="college-fields">
        {collegeFields.map(([key, label, min, max, unit]) => (
          <NumberField
            key={key === 'startingSalary' ? `${key}-${salaryVersion}` : key}
            label={label}
            value={college[key]}
            min={min}
            max={max}
            unit={unit}
            hint={collegeFieldHints[key]}
            onChange={(v) => update({ ...college, [key]: v })}
          />
        ))}
      </div>
      <div className="college-total">
        <span>Annual net cost</span>
        <strong>
          {money(collegeCost(college).annualNetCost)}
          <small> / yr</small>
        </strong>
      </div>
    </article>
  );
}
