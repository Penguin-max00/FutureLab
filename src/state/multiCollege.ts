import type { Workspace } from './defaults';
export function addCollege(workspace: Workspace): Workspace {
  if (workspace.colleges.length >= 4) return workspace;
  const letter = 'ABCD'[workspace.colleges.length];
  return {
    ...workspace,
    colleges: [
      ...workspace.colleges,
      {
        id: crypto.randomUUID(),
        name: `College ${letter}`,
        tuition: 0,
        livingCost: 0,
        scholarships: 0,
        familyContribution: 0,
        yearsOfAttendance: 4,
        startingSalary: 0,
      },
    ],
  };
}
export function removeLastCollege(workspace: Workspace): Workspace {
  if (workspace.colleges.length <= 2) return workspace;
  const letter = 'ABCD'[workspace.colleges.length - 1] as 'C' | 'D';
  const assumptions = { ...workspace.assumptions };
  delete assumptions[`careerEvents${letter}`];
  delete assumptions[`jobSearchMonths${letter}`];
  return { colleges: workspace.colleges.slice(0, -1), assumptions };
}
