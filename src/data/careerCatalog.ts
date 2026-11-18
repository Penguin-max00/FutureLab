// Curated official-source snapshot; not a live search or a ranking of programs.
export const catalogCheckedOn = '2026-11-17';
export const wageYear = 2025;
export const projectionPeriod = '2025–35';

export const careers = {
  software: {
    name: 'Software developer',
    median: 135980,
    growth: 10,
    soc: '15-1252',
    source:
      'https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm',
  },
  testing: {
    name: 'Software QA analyst / tester',
    median: 104300,
    growth: 6,
    soc: '15-1253',
    source:
      'https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm',
  },
  accounting: {
    name: 'Accountant / auditor',
    median: 83680,
    growth: 5,
    soc: '13-2011',
    source:
      'https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm',
  },
  mechanical: {
    name: 'Mechanical engineer',
    median: 104110,
    growth: 11,
    soc: '17-2141',
    source:
      'https://www.bls.gov/ooh/architecture-and-engineering/mechanical-engineers.htm',
  },
} as const;
export type CareerId = keyof typeof careers;
export interface CatalogProgram {
  id: string;
  name: string;
  source: string;
  careers: CareerId[];
}
export interface CatalogSchool {
  id: string;
  name: string;
  location: string;
  aliases: string[];
  programs: CatalogProgram[];
}
export const schools: CatalogSchool[] = [
  {
    id: 'asu-tempe',
    name: 'Arizona State University — Tempe',
    location: 'Tempe, AZ',
    aliases: ['ASU', 'Arizona State', '亚利桑那州立大学'],
    programs: [
      {
        id: 'cs',
        name: 'Computer Science, BS',
        source:
          'https://scai.engineering.asu.edu/computer-science-bs/degree-requirements/',
        careers: ['software', 'testing'],
      },
      {
        id: 'accounting',
        name: 'Accountancy, BS',
        source: 'https://degrees.asu.edu/checksheet/2026/CBA/BAACCBS/null',
        careers: ['accounting'],
      },
      {
        id: 'mechanical',
        name: 'Mechanical Engineering, BSE',
        source: 'https://degrees.asu.edu/checksheet/2025/CES/ESMAEMBSE/null',
        careers: ['mechanical'],
      },
    ],
  },
  {
    id: 'psu-university-park',
    name: 'Penn State — University Park',
    location: 'University Park, PA',
    aliases: [
      'PSU',
      'Pennsylvania State University',
      '宾夕法尼亚州立大学',
      '宾州州立',
    ],
    programs: [
      {
        id: 'cs',
        name: 'Computer Science, BS',
        source:
          'https://bulletins.psu.edu/undergraduate/colleges/engineering/computer-science-bs/',
        careers: ['software', 'testing'],
      },
      {
        id: 'accounting',
        name: 'Accounting, BS',
        source:
          'https://bulletins.psu.edu/undergraduate/colleges/smeal-business/accounting-bs/',
        careers: ['accounting'],
      },
      {
        id: 'mechanical',
        name: 'Mechanical Engineering, BS',
        source:
          'https://bulletins.psu.edu/undergraduate/colleges/engineering/mechanical-engineering-bs/',
        careers: ['mechanical'],
      },
    ],
  },
  {
    id: 'uiuc',
    name: 'University of Illinois Urbana-Champaign',
    location: 'Urbana-Champaign, IL',
    aliases: ['UIUC', 'Illinois', '伊利诺伊大学', '香槟'],
    programs: [
      {
        id: 'cs',
        name: 'Computer Science, BS',
        source:
          'https://catalog.illinois.edu/undergraduate/engineering/computer-science-bs/',
        careers: ['software', 'testing'],
      },
      {
        id: 'accounting',
        name: 'Accountancy, BS',
        source:
          'https://catalog.illinois.edu/undergraduate/bus/accountancy-bs/',
        careers: ['accounting'],
      },
      {
        id: 'mechanical',
        name: 'Mechanical Engineering, BS',
        source:
          'https://catalog.illinois.edu/undergraduate/engineering/mechanical-engineering-bs/',
        careers: ['mechanical'],
      },
    ],
  },
];
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\s—–-]+/g, ' ')
    .trim();
export function searchSchools(query: string): CatalogSchool[] {
  const words = normalize(query).split(' ');
  return schools.filter((school) => {
    const text = normalize(
      [school.name, school.location, ...school.aliases].join(' '),
    );
    return words.every((word) => text.includes(word));
  });
}
export function salaryAssumption(value: string): number | null {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= 500000
    ? amount
    : null;
}
