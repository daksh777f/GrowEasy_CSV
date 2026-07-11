import { describe, it, expect } from 'vitest';
import { validateAndNormalizeRecord } from '../utils/recordValidator';

describe('Record Validator', () => {
  it('should pass a valid record with email', () => {
    const raw = {
      name: 'John Doe',
      email: 'john@example.com',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      data_source: 'leads_on_demand'
    };
    const result = validateAndNormalizeRecord(raw);
    
    expect(result.success).toBe(true);
    expect(result.record?.email).toBe('john@example.com');
  });

  it('should skip a record with neither email nor mobile', () => {
    const raw = {
      name: 'John Doe',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
    };
    const result = validateAndNormalizeRecord(raw);
    
    expect(result.success).toBe(false);
    expect(result.skipReason).toContain('no email or mobile number found');
  });

  it('should split multiple emails and append to crm_note', () => {
    const raw = {
      name: 'John Doe',
      email: 'john@example.com, john2@example.com ; john3@example.com',
      crm_note: 'Existing note'
    };
    const result = validateAndNormalizeRecord(raw);
    
    expect(result.success).toBe(true);
    expect(result.record?.email).toBe('john@example.com');
    expect(result.record?.crm_note).toContain('Existing note | Additional emails: john2@example.com, john3@example.com');
  });

  it('should blank out invalid enums', () => {
    const raw = {
      name: 'Jane',
      email: 'jane@example.com',
      crm_status: 'NOT_A_REAL_STATUS',
      data_source: 'unknown_source'
    };
    const result = validateAndNormalizeRecord(raw);
    
    expect(result.success).toBe(true);
    expect(result.record?.crm_status).toBeUndefined();
    expect(result.record?.data_source).toBeUndefined();
  });

  it('should automatically provide a valid created_at date if missing or invalid', () => {
    const raw = {
      name: 'Jane',
      email: 'jane@example.com',
      created_at: 'not_a_date'
    };
    const result = validateAndNormalizeRecord(raw);
    
    expect(result.success).toBe(true);
    // Should be overwritten with current date
    expect(new Date(result.record!.created_at!).getTime()).not.toBeNaN();
    expect(result.record?.crm_note).toContain('Original created_at was invalid: not_a_date');
  });
});
