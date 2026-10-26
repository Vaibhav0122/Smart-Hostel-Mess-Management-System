/**
 * Phase 4: Lightweight CSV parser utility.
 *
 * Parses CSV text content into an array of key-value row objects.
 * Handles:
 *   - Header extraction and normalization
 *   - Quoted fields containing commas
 *   - Trim of whitespace on all values
 *   - Line-by-line error reporting
 */

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  parseErrors: Array<{ row: number; message: string }>;
}

/**
 * Parse raw CSV text into structured row objects.
 * Expects a header row as the first line.
 */
export function parseCsvText(csvText: string): CsvParseResult {
  const result: CsvParseResult = {
    headers: [],
    rows: [],
    parseErrors: [],
  };

  const lines = csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    result.parseErrors.push({ row: 0, message: "CSV file is empty." });
    return result;
  }

  // Parse header row
  result.headers = parseLineFields(lines[0]).map((h) => h.trim());

  if (result.headers.length === 0) {
    result.parseErrors.push({ row: 1, message: "No column headers found in the first row." });
    return result;
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1; // 1-indexed for user-facing display
    const fields = parseLineFields(lines[i]);

    if (fields.length !== result.headers.length) {
      result.parseErrors.push({
        row: lineNumber,
        message: `Expected ${result.headers.length} columns but found ${fields.length}.`,
      });
      continue;
    }

    const rowObj: Record<string, string> = {};
    for (let j = 0; j < result.headers.length; j++) {
      rowObj[result.headers[j]] = fields[j].trim();
    }
    result.rows.push(rowObj);
  }

  return result;
}

/**
 * Parse a single CSV line into fields, respecting quoted strings.
 * Handles fields wrapped in double quotes that contain commas.
 */
function parseLineFields(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped double-quote ("")
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip the next double-quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  fields.push(current); // Push the last field
  return fields;
}
