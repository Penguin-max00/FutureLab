import { describe, expect, it } from 'vitest';
import { defaults, isWorkspace, isExampleWorkspace } from '../state/defaults';
import { addCollege, removeLastCollege } from '../state/multiCollege';
import { simulate } from './simulation';
import { experimentInputs, initialExploration } from './experiments';
import { readLibrary, snapshot, sameComparison } from '../state/savedPlans';
describe('two to four college comparisons', () => {
  it('adds independent zero-value colleges up to four and preserves original inputs', () => {
    const four = addCollege(addCollege(structuredClone(defaults)));
    expect(four.colleges).toHaveLength(4);
    expect(four.colleges.slice(0, 2)).toEqual(defaults.colleges);
    expect(four.colleges[2].name).toBe('College C');
    expect(four.colleges[3].tuition).toBe(0);
    expect(new Set(four.colleges.map((college) => college.id)).size).toBe(4);
    expect(addCollege(four)).toBe(four);
    expect(isWorkspace(four)).toBe(true);
    expect(isExampleWorkspace(four)).toBe(false);
  });
  it('supports legacy adjustments and independent C/D salaries, careers and job delays', () => {
    const four = addCollege(addCollege(structuredClone(defaults)));
    four.colleges[2].startingSalary = 60000;
    four.colleges[3].startingSalary = 72000;
    four.assumptions.jobSearchMonthsC = 2;
    four.assumptions.careerEventsD = [
      { id: 'd', month: 1, kind: 'career-change', annualSalary: 96000 },
    ];
    const inputs = experimentInputs(four, initialExploration()).inputs;
    const results = inputs.colleges.map((college, i) =>
      simulate(college, inputs.assumptions, i),
    );
    expect(results[2].snapshots[1].grossIncome).toBe(0);
    expect(results[2].snapshots[3].grossIncome).toBe(5000);
    expect(results[3].firstBudget.grossIncome).toBe(8000);
    expect(
      results.every((result) =>
        Number.isFinite(result.snapshots.at(-1)!.netWorth),
      ),
    ).toBe(true);
    const changed = experimentInputs(four, {
      scenario: 'baseline',
      changes: {
        extraAid: [0, 0, 1000, 2000],
        salaryChange: [0, 0, 0.1, -0.1],
        monthlyExpenseChange: 0,
      },
    });
    expect(changed.inputs.colleges[2].startingSalary).toBe(66000);
    expect(changed.inputs.colleges[3].scholarships).toBe(2000);
  });
  it('round trips all colleges in saved plans and detects different counts', () => {
    const workspace = addCollege(addCollege(structuredClone(defaults)));
    const exploration = initialExploration();
    const plan = snapshot({ workspace, exploration }, 'four', 'Four offers', 1);
    expect(
      readLibrary({
        getItem: () =>
          JSON.stringify({ version: 1, plans: [plan], activeId: 'four' }),
      }).plans[0],
    ).toEqual(plan);
    expect(sameComparison(plan, { workspace: defaults, exploration })).toBe(
      false,
    );
    expect(sameComparison({ workspace: defaults, exploration }, plan)).toBe(
      false,
    );
  });
  it('removes optional colleges and clears their settings', () => {
    const four = addCollege(addCollege(structuredClone(defaults)));
    four.assumptions.jobSearchMonthsD = 12;
    four.assumptions.careerEventsD = [
      { id: 'd', month: 3, kind: 'unemployment', duration: 6 },
    ];
    const three = removeLastCollege(four);
    expect(three.colleges).toHaveLength(3);
    expect(three.assumptions.careerEventsD).toBeUndefined();
    expect(three.assumptions.jobSearchMonthsD).toBeUndefined();
    expect(removeLastCollege(removeLastCollege(three)).colleges).toHaveLength(
      2,
    );
    expect(isWorkspace({ ...four, colleges: [four.colleges[0]] })).toBe(false);
    expect(
      isWorkspace({ ...four, colleges: [...four.colleges, four.colleges[0]] }),
    ).toBe(false);
  });
});
