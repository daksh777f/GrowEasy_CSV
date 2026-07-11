import { describe, it, expect } from 'vitest';
import { validateAndNormalizeRecord } from './recordValidator';

describe('recordValidator', () => {
  it('should skip records with neither email nor mobile', () => {
    const raw = { name: 'John Doe', city: 'Mumbai' };
    const res = validateAndNormalizeRecord(raw);
    expect(res.success).toBe(false);
    expect(res.skipReason).toBe('no email or mobile number found');
  });

  it('should extract first email and put rest in crm_note', () => {
    const raw = { 
      name: 'Jane', 
      email: 'jane@example.com, jane2@example.com; jane3@test.com',
      mobile_without_country_code: '9876543210'
    };
    const res = validateAndNormalizeRecord(raw);
    expect(res.success).toBe(true);
    expect(res.record?.email).toBe('jane@example.com');
    expect(res.record?.crm_note).toContain('jane2@example.com, jane3@test.com');
  });

  it('should extract first mobile and put rest in crm_note', () => {
    const raw = { 
      name: 'Jack', 
      email: 'jack@example.com',
      mobile_without_country_code: '1234567890 0987654321'
    };
    const res = validateAndNormalizeRecord(raw);
    expect(res.success).toBe(true);
    expect(res.record?.mobile_without_country_code).toBe('1234567890');
    expect(res.record?.crm_note).toContain('0987654321');
  });

  it('should blank out invalid enum values', () => {
    const raw = {
      email: 'test@test.com',
      crm_status: 'INVALID_STATUS',
      data_source: 'some_random_source'
    };
    const res = validateAndNormalizeRecord(raw);
    expect(res.success).toBe(true);
    expect(res.record?.crm_status).toBeUndefined();
    expect(res.record?.data_source).toBeUndefined();
  });

  it('should keep valid enum values', () => {
    const raw = {
      email: 'test@test.com',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      data_source: 'eden_park'
    };
    const res = validateAndNormalizeRecord(raw);
    expect(res.success).toBe(true);
    expect(res.record?.crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(res.record?.data_source).toBe('eden_park');
  });
});
