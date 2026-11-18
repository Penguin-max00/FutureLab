import { describe, expect, it } from 'vitest';
import {
  careers,
  salaryAssumption,
  schools,
  searchSchools,
} from './careerCatalog';

describe('college and career references', () => {
  it('finds campus names and aliases without inventing matches', () => {
    expect(searchSchools('  pSu  ').map((school) => school.id)).toEqual([
      'psu-university-park',
    ]);
    expect(searchSchools('香槟').map((school) => school.id)).toEqual(['uiuc']);
    expect(searchSchools('Arizona Tempe').map((school) => school.id)).toEqual([
      'asu-tempe',
    ]);
    expect(searchSchools('not a covered university')).toEqual([]);
    expect(searchSchools('')).toHaveLength(schools.length);
  });
  it('keeps every program tied to its official source and existing career', () => {
    expect(new Set(schools.map((school) => school.id)).size).toBe(
      schools.length,
    );
    for (const school of schools) {
      expect(school.name.length).toBeLessThanOrEqual(80);
      for (const program of school.programs) {
        expect(new URL(program.source).hostname).toMatch(/\.(edu)$/);
        expect(program.careers.length).toBeGreaterThan(0);
        for (const id of program.careers) {
          expect(careers[id].median).toBeGreaterThan(0);
          expect(new URL(careers[id].source).hostname).toBe('www.bls.gov');
        }
      }
    }
  });
  it('requires an explicit valid salary while allowing zero', () => {
    for (const invalid of ['', ' ', 'abc', '-1', '500001', 'Infinity'])
      expect(salaryAssumption(invalid)).toBeNull();
    expect(salaryAssumption('0')).toBe(0);
    expect(salaryAssumption('72000.50')).toBe(72000.5);
    expect(salaryAssumption('500000')).toBe(500000);
  });
});
