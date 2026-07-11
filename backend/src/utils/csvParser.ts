import { parse } from 'csv-parse/sync';

export function parseCsv(fileBuffer: Buffer | string): Record<string, string>[] {
  const content = typeof fileBuffer === 'string' ? fileBuffer : fileBuffer.toString('utf-8');
  
  // We use csv-parse/sync to synchronously parse
  // Columns: true gives us objects with header keys
  // skip_empty_lines: true ignores empty lines
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records as Record<string, string>[];
}
