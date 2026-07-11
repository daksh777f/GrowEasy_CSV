import stringSimilarity from 'string-similarity';

export type CrmFieldKey =
  | 'created_at'
  | 'name'
  | 'email'
  | 'country_code'
  | 'mobile_without_country_code'
  | 'company'
  | 'city'
  | 'state'
  | 'country'
  | 'lead_owner'
  | 'crm_status'
  | 'crm_note'
  | 'data_source'
  | 'possession_time'
  | 'description';

export interface ColumnMappingResult {
  csvHeader: string;
  mappedField: CrmFieldKey | null;
  confidence: 'high' | 'medium' | 'low';
}

const FIELD_SYNONYMS: Record<CrmFieldKey, string[]> = {
  created_at: ['created at', 'created time', 'date added', 'lead date', 'created', 'date'],
  name: ['name', 'full name', 'client name', 'lead name', 'first name', 'last name', 'customer name'],
  email: ['email', 'email address', 'e-mail', 'e-mail id', 'mail'],
  country_code: ['country code', 'phone code', 'dial code'],
  mobile_without_country_code: ['mobile', 'mobile no', 'mobile number', 'phone', 'phone no', 'phone number', 'contact number', 'ph no', 'ph no.', 'contact'],
  company: ['company', 'company name', 'organization', 'employer'],
  city: ['city', 'town'],
  state: ['state', 'province', 'region'],
  country: ['country', 'nation'],
  lead_owner: ['lead owner', 'owner', 'assigned to', 'agent'],
  crm_status: ['crm status', 'status', 'lead status', 'state'],
  crm_note: ['crm note', 'note', 'notes', 'remarks', 'comments', 'additional info'],
  data_source: ['data source', 'source', 'campaign', 'ad name', 'form name', 'medium'],
  possession_time: ['possession time', 'possession', 'move in', 'move in time'],
  description: ['description', 'desc', 'details', 'extra details'],
};

export function mapHeadersDeterministically(csvHeaders: string[]): ColumnMappingResult[] {
  return csvHeaders.map((header) => {
    const normalizedHeader = header.toLowerCase().trim();
    if (!normalizedHeader) return { csvHeader: header, mappedField: null, confidence: 'low' };

    let bestMatch: { field: CrmFieldKey | null; rating: number } = { field: null, rating: 0 };

    for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      const crmField = field as CrmFieldKey;
      
      // Exact Match
      if (normalizedHeader === crmField.replace(/_/g, ' ') || normalizedHeader === crmField) {
        return { csvHeader: header, mappedField: crmField, confidence: 'high' };
      }

      // Synonym Exact Match
      if (synonyms.includes(normalizedHeader)) {
        return { csvHeader: header, mappedField: crmField, confidence: 'high' };
      }

      // Fuzzy Match against synonyms
      const match = stringSimilarity.findBestMatch(normalizedHeader, synonyms);
      if (match.bestMatch.rating > bestMatch.rating) {
        bestMatch = { field: crmField, rating: match.bestMatch.rating };
      }
    }

    if (bestMatch.rating > 0.8) {
      return { csvHeader: header, mappedField: bestMatch.field, confidence: 'high' };
    } else if (bestMatch.rating > 0.6) {
      return { csvHeader: header, mappedField: bestMatch.field, confidence: 'medium' };
    }

    return { csvHeader: header, mappedField: null, confidence: 'low' };
  });
}
