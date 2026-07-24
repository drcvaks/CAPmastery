export const QUESTION_CSV_HEADERS = [
  "external_id",
  "pilot_batch",
  "objective_code",
  "concept_code",
  "question_family_code",
  "difficulty",
  "cognitive_level",
  "question_type",
  "question_text",
  "choice_a",
  "choice_b",
  "choice_c",
  "choice_d",
  "correct_letter",
  "explanation",
  "short_explanation",
  "feedback_display_version",
  "choice_a_explanation",
  "choice_b_explanation",
  "choice_c_explanation",
  "choice_d_explanation",
  "common_mistake",
  "remediation_text",
  "memory_aid",
  "visual_priority",
  "visual_type",
  "visual_display_mode",
  "visual_asset_key",
  "visual_brief",
  "visual_caption",
  "visual_alt_text",
  "source_reference_text",
  "source_pages",
  "source_status",
  "review_status",
  "reinforcement_question_ids",
  "estimated_time_seconds",
] as const;

export type QuestionCsvHeader = (typeof QUESTION_CSV_HEADERS)[number];
export type QuestionCsvRow = Record<QuestionCsvHeader, string>;

export type CsvIssue = {
  row: number;
  externalId?: string;
  message: string;
};

export type CsvPreview = {
  rows: QuestionCsvRow[];
  errors: CsvIssue[];
  warnings: CsvIssue[];
};

const OPTIONAL_FIELDS = new Set<QuestionCsvHeader>([
  "pilot_batch",
  "short_explanation",
  "feedback_display_version",
  "choice_a_explanation",
  "choice_b_explanation",
  "choice_c_explanation",
  "choice_d_explanation",
  "common_mistake",
  "remediation_text",
  "memory_aid",
  "visual_priority",
  "visual_type",
  "visual_display_mode",
  "visual_asset_key",
  "visual_brief",
  "visual_caption",
  "visual_alt_text",
  "reinforcement_question_ids",
]);

export const QUESTION_CSV_TEMPLATE = `${QUESTION_CSV_HEADERS.join(",")}\r\n`;

export function parseDelimitedText(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "");
  const firstLine = input.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  const matrix: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === delimiter) {
      row.push(field.trim());
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, "").trim());
      if (row.some(Boolean)) matrix.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unterminated quoted field.");
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, "").trim());
    if (row.some(Boolean)) matrix.push(row);
  }
  return matrix;
}

export function validateQuestionCsv(text: string): CsvPreview {
  const errors: CsvIssue[] = [];
  const warnings: CsvIssue[] = [];
  let matrix: string[][];
  try {
    matrix = parseDelimitedText(text);
  } catch (error) {
    return {
      rows: [],
      errors: [{ row: 1, message: error instanceof Error ? error.message : "Invalid CSV." }],
      warnings,
    };
  }
  if (matrix.length === 0) {
    return {
      rows: [],
      errors: [{ row: 1, message: "Paste a CSV header and data rows." }],
      warnings,
    };
  }

  const headers = matrix[0] ?? [];
  const missing = QUESTION_CSV_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    errors.push({ row: 1, message: `Missing required columns: ${missing.join(", ")}.` });
    return { rows: [], errors, warnings };
  }
  const rows: QuestionCsvRow[] = [];
  const externalIds = new Set<string>();
  const normalizedPrompts = new Map<string, number>();

  matrix.slice(1).forEach((values, rowIndex) => {
    const csvRow = rowIndex + 2;
    if (values.length !== headers.length) {
      errors.push({
        row: csvRow,
        message: `Found ${values.length} fields; expected ${headers.length}.`,
      });
      return;
    }
    const raw = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const row = Object.fromEntries(
      QUESTION_CSV_HEADERS.map((header) => [header, String(raw[header] ?? "").trim()]),
    ) as QuestionCsvRow;
    rows.push(row);
    const externalId = row.external_id.toUpperCase();
    const issue = (message: string) => errors.push({ row: csvRow, externalId, message });

    for (const field of QUESTION_CSV_HEADERS) {
      if (!OPTIONAL_FIELDS.has(field) && !row[field]) issue(`${field} is required.`);
    }
    if (!/^[A-Z0-9][A-Z0-9_-]{2,119}$/.test(externalId))
      issue("external_id has an invalid format.");
    if (externalIds.has(externalId)) issue("external_id is duplicated in this file.");
    externalIds.add(externalId);
    if (!new Set(["easy", "medium", "hard"]).has(row.difficulty)) issue("difficulty is invalid.");
    if (
      !new Set([
        "recall",
        "recognition",
        "understanding",
        "application",
        "analysis",
        "scenario",
      ]).has(row.cognitive_level)
    ) {
      issue("cognitive_level is invalid.");
    }
    if (row.question_type !== "multiple_choice")
      issue("Only multiple_choice is supported in this workflow.");
    if (!new Set(["A", "B", "C", "D"]).has(row.correct_letter))
      issue("correct_letter must be A, B, C, or D.");
    if (row.review_status !== "draft") issue("review_status must be draft.");
    if (!/^\d+(?:\s*[-–—]\s*\d+)?$/.test(row.source_pages))
      issue("source_pages must be a page or range.");
    if (!/^\d+$/.test(row.estimated_time_seconds) || Number(row.estimated_time_seconds) < 1) {
      issue("estimated_time_seconds must be a positive integer.");
    }
    if (
      row.feedback_display_version &&
      (!/^\d+$/.test(row.feedback_display_version) || Number(row.feedback_display_version) < 1)
    ) {
      issue("feedback_display_version must be a positive integer when supplied.");
    }
    const visualFields: QuestionCsvHeader[] = [
      "visual_priority",
      "visual_type",
      "visual_display_mode",
      "visual_asset_key",
      "visual_brief",
      "visual_caption",
      "visual_alt_text",
    ];
    if (visualFields.some((field) => row[field])) {
      if (!row.short_explanation) issue("short_explanation is required with learning support.");
      visualFields.forEach((field) => {
        if (!row[field]) issue(`${field} is required when visual metadata is supplied.`);
      });
    }

    const normalized = normalizePrompt(row.question_text);
    const earlierRow = normalizedPrompts.get(normalized);
    if (normalized && earlierRow) {
      warnings.push({
        row: csvRow,
        externalId,
        message: `Question text resembles row ${earlierRow}.`,
      });
    } else if (normalized) {
      normalizedPrompts.set(normalized, csvRow);
    }
    for (const value of Object.values(row)) {
      if (/^[=+@]/.test(value)) {
        warnings.push({
          row: csvRow,
          externalId,
          message: "A value begins with a spreadsheet formula character; review it carefully.",
        });
        break;
      }
    }
  });

  return { rows, errors, warnings };
}

export function normalizePrompt(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}
