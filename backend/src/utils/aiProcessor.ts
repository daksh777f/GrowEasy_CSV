import Groq from 'groq-sdk';
import pLimit from 'p-limit';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// JSON schemas for Cerebras prompts
const headerMapSchemaPrompt = `
Respond strictly with a JSON object in the following format:
{
  "mappings": [
    { "csvHeader": "string", "mappedField": "string" }
  ]
}
`;

const extractionSchemaPrompt = `
Respond strictly with a JSON object containing an array of normalized records:
{
  "records": [
    {
      "created_at": "string",
      "name": "string",
      "email": "string",
      "country_code": "string",
      "mobile_without_country_code": "string",
      "company": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "lead_owner": "string",
      "crm_status": "GOOD_LEAD_FOLLOW_UP | DID_NOT_CONNECT | BAD_LEAD | SALE_DONE",
      "crm_note": "string",
      "data_source": "leads_on_demand | meridian_tower | eden_park | varah_swamy | sarjapur_plots",
      "possession_time": "string",
      "description": "string"
    }
  ]
}
`;

export async function inferHeadersWithAI(
  unmappedHeaders: string[],
  samples: Record<string, string>[]
): Promise<Record<string, string>> {
  if (unmappedHeaders.length === 0) return {};

  const prompt = `You are a data extraction expert. I have a CSV with some headers that couldn't be deterministically mapped.
Here are the headers that need mapping:
${JSON.stringify(unmappedHeaders)}

Here are 3 sample rows to give you context:
${JSON.stringify(samples, null, 2)}

Propose a mapping for each header to one of the following CRM fields, or null if it doesn't match any:
[created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description]

${headerMapSchemaPrompt}`;

  try {
    const response = (await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })) as any;

    const text = response.choices[0].message?.content || "{}";
    const data = JSON.parse(text);
    const result: Record<string, string> = {};
    for (const mapping of data.mappings || []) {
      if (mapping.mappedField && mapping.mappedField !== 'null') {
        result[mapping.csvHeader] = mapping.mappedField;
      }
    }
    return result;
  } catch (e) {
    console.error("Failed to parse AI header mapping", e);
    return {};
  }
}

export async function extractRecordsBatch(
  records: Record<string, string>[],
  retryCount = 0
): Promise<any[]> {
  const prompt = `You are an AI data extractor for a real estate CRM.
Given the following JSON array of raw CSV rows, extract and normalize the data into the structured schema.
Rules:
1. Normalize crm_status to exactly one of the enum values if possible.
2. Normalize data_source to exactly one of the enum values if possible.
3. Keep dates as valid string dates.
4. Extract 'mobile_without_country_code' carefully.
5. Multiple emails or mobiles: first goes to main field, others append to crm_note.
6. Put catch-all extra info in crm_note.

Data:
${JSON.stringify(records, null, 2)}

${extractionSchemaPrompt}`;

  try {
    const response = (await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })) as any;

    const text = response.choices[0].message?.content || "{}";
    const parsed = JSON.parse(text);
    return parsed.records || [];
  } catch (error) {
    if (retryCount < 3) {
      console.warn(`Batch extraction failed, retrying (${retryCount + 1}/3)...`, error);
      // Exponential backoff
      await new Promise(res => setTimeout(res, Math.pow(2, retryCount) * 1000));
      return extractRecordsBatch(records, retryCount + 1);
    }
    throw new Error('AI extraction failed after retries');
  }
}

export async function processRecordsConcurrently(
  records: Record<string, string>[],
  concurrencyLimit = 3,
  batchSize = 20,
  onProgress?: (processed: number, total: number) => void
): Promise<any[]> {
  const limit = pLimit(concurrencyLimit);
  const batches = [];
  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }

  let processedCount = 0;
  const totalCount = records.length;

  const promises = batches.map((batch) =>
    limit(async () => {
      const extracted = await extractRecordsBatch(batch);
      processedCount += batch.length;
      if (onProgress) {
        onProgress(processedCount, totalCount);
      }
      // Add a small delay to avoid TPM rate limits on restricted accounts
      await new Promise(res => setTimeout(res, 1500));
      return extracted;
    })
  );

  const results = await Promise.all(promises);
  return results.flat();
}
