import { describe, it, expect } from 'vitest';
import { mapHeadersDeterministically } from '../utils/headerMapper';

describe('Header Mapper', () => {
  it('should map exact matches with high confidence', () => {
    const headers = ['email', 'name', 'city'];
    const result = mapHeadersDeterministically(headers);
    
    expect(result).toHaveLength(3);
    expect(result[0].mappedField).toBe('email');
    expect(result[0].confidence).toBe('high');
    expect(result[1].mappedField).toBe('name');
    expect(result[1].confidence).toBe('high');
    expect(result[2].mappedField).toBe('city');
    expect(result[2].confidence).toBe('high');
  });

  it('should map synonyms with high confidence', () => {
    const headers = ['full name', 'e-mail id', 'mobile no'];
    const result = mapHeadersDeterministically(headers);
    
    expect(result[0].mappedField).toBe('name');
    expect(result[0].confidence).toBe('high');
    expect(result[1].mappedField).toBe('email');
    expect(result[1].confidence).toBe('high');
    expect(result[2].mappedField).toBe('mobile_without_country_code');
    expect(result[2].confidence).toBe('high');
  });

  it('should fuzzy match slightly misspelled headers', () => {
    const headers = ['first  name', 'citi', 'companie'];
    const result = mapHeadersDeterministically(headers);
    
    // citi to city, companie to company
    expect(result[1].mappedField).toBe('city');
    expect(result[2].mappedField).toBe('company');
  });

  it('should return low confidence for completely unknown headers', () => {
    const headers = ['random_metric', 'favorite color'];
    const result = mapHeadersDeterministically(headers);
    
    expect(result[0].confidence).toBe('low');
    expect(result[0].mappedField).toBeNull();
    expect(result[1].confidence).toBe('low');
    expect(result[1].mappedField).toBeNull();
  });
});
