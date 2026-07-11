import { CrmRecord, CrmRecordSchema, CrmStatusEnum, DataSourceEnum } from '../types/crm';

export interface ValidatedRecordResult {
  success: boolean;
  record?: CrmRecord;
  skipReason?: string;
}

export function validateAndNormalizeRecord(rawRecord: any): ValidatedRecordResult {
  // Defensive copy
  const record = { ...rawRecord };

  // 1. Enforce skip rule first (so we don't bother doing more if it fails)
  const hasEmail = Boolean(record.email && record.email.trim());
  const hasMobile = Boolean(record.mobile_without_country_code && record.mobile_without_country_code.trim());

  if (!hasEmail && !hasMobile) {
    return { success: false, skipReason: 'no email or mobile number found' };
  }

  // 2. Multi-value enforcement for email
  let extraNotes: string[] = [];
  if (record.email) {
    const emails = record.email.split(/[\s,;]+/).filter(Boolean);
    if (emails.length > 1) {
      record.email = emails[0];
      extraNotes.push(`Additional emails: ${emails.slice(1).join(', ')}`);
    }
  }

  // 3. Multi-value enforcement for mobile
  if (record.mobile_without_country_code) {
    const mobiles = record.mobile_without_country_code.split(/[\s,;]+/).filter(Boolean);
    if (mobiles.length > 1) {
      record.mobile_without_country_code = mobiles[0];
      extraNotes.push(`Additional mobiles: ${mobiles.slice(1).join(', ')}`);
    }
  }

  // 4. Validate Enums
  const statusResult = CrmStatusEnum.safeParse(record.crm_status);
  if (!statusResult.success) {
    record.crm_status = undefined; // Blank it out if invalid
  }

  const sourceResult = DataSourceEnum.safeParse(record.data_source);
  if (!sourceResult.success) {
    record.data_source = undefined; // Blank it out if invalid
  }

  // 5. Date validation
  if (record.created_at) {
    const d = new Date(record.created_at);
    if (isNaN(d.getTime())) {
      extraNotes.push(`Original created_at was invalid: ${record.created_at}`);
      record.created_at = new Date().toISOString(); // Provide a fallback or leave it?
      // Actually, schema requires a valid date string. Let's provide current date or blank it out?
      // Wait, Zod schema says it must be a string. If it's optional, we can delete it.
      // Wait, created_at is NOT optional in schema. Let's use current time as fallback.
      // Wait! Let's check schema: `created_at` is NOT optional. We should put current time or keep it and let zod fail.
      // Let's fallback to Date.now() or just leave it. If we use a dummy date, it's safe. Let's use new Date().toISOString().
    }
  } else {
    record.created_at = new Date().toISOString();
  }

  // Append extra notes
  if (extraNotes.length > 0) {
    record.crm_note = record.crm_note ? `${record.crm_note} | ${extraNotes.join(' | ')}` : extraNotes.join(' | ');
  }

  // Finally, run through strict Zod schema validation
  const finalValidation = CrmRecordSchema.safeParse(record);

  if (!finalValidation.success) {
    return {
      success: false,
      skipReason: `Validation failed: ${finalValidation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`
    };
  }

  return { success: true, record: finalValidation.data as CrmRecord };
}
