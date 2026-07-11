import { describe, it, expect } from 'vitest';
import { mapHeadersDeterministically } from './headerMapper';

describe('headerMapper', () => {
  it('should map exact matches', () => {
    const res = mapHeadersDeterministically(['email', 'name']);
    expect(res[0].mappedField).toBe('email');
    expect(res[0].confidence).toBe('high');
    expect(res[1].mappedField).toBe('name');
  });

  it('should map fuzzy matches / synonyms', () => {
    const res = mapHeadersDeterministically(['Ph No.', 'E-mail ID', 'Lead Date']);
    expect(res[0].mappedField).toBe('mobile_without_country_code');
    expect(res[1].mappedField).toBe('email');
    expect(res[2].mappedField).toBe('created_at');
  });

  it('should return low confidence / null for unknown headers', () => {
    const res = mapHeadersDeterministically(['some weird column', '']);
    expect(res[0].confidence).toBe('low');
    expect(res[0].mappedField).toBeNull();
    expect(res[1].confidence).toBe('low');
  });
});
