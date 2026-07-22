const REQUIRED_FIELDS = [
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
];

const OPTIONAL_VALUE_FIELDS = new Set([
  "reinforcement_question_ids",
  "memory_aid",
  "visual_priority",
  "visual_type",
  "visual_display_mode",
  "visual_asset_key",
  "visual_brief",
  "visual_caption",
  "visual_alt_text",
]);

function decodeImportBuffer(buffer) {
  const utf8 = buffer.toString("utf8");
  if (!utf8.includes("\uFFFD")) return utf8;
  const windows1252 = new Map([
    [0x80, "€"],
    [0x82, "‚"],
    [0x83, "ƒ"],
    [0x84, "„"],
    [0x85, "…"],
    [0x86, "†"],
    [0x87, "‡"],
    [0x88, "ˆ"],
    [0x89, "‰"],
    [0x8a, "Š"],
    [0x8b, "‹"],
    [0x8c, "Œ"],
    [0x8e, "Ž"],
    [0x91, "‘"],
    [0x92, "’"],
    [0x93, "“"],
    [0x94, "”"],
    [0x95, "•"],
    [0x96, "–"],
    [0x97, "—"],
    [0x98, "˜"],
    [0x99, "™"],
    [0x9a, "š"],
    [0x9b, "›"],
    [0x9c, "œ"],
    [0x9e, "ž"],
    [0x9f, "Ÿ"],
  ]);
  return Array.from(buffer, (byte) => windows1252.get(byte) ?? String.fromCharCode(byte)).join("");
}

function parseDelimited(text, delimiter = "\t") {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
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
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The import file contains an unterminated quoted field.");
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((values) => values.some((value) => value.length > 0));
}

function parseImport(text) {
  const matrix = parseDelimited(text.replace(/^\uFEFF/, ""));
  if (matrix.length < 2) throw new Error("The import file has no data rows.");
  const headers = matrix[0];
  const missingHeaders = REQUIRED_FIELDS.filter((field) => !headers.includes(field));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
  }
  return matrix.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`Row ${index + 2} has ${values.length} fields; expected ${headers.length}.`);
    }
    return Object.fromEntries(headers.map((header, column) => [header, values[column].trim()]));
  });
}

function parseSourcePages(value) {
  const match = value.match(/^(\d+)(?:\s*[-–—]\s*(\d+))?$/u);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);
  return start > 0 && end >= start ? { start, end } : null;
}

function validateImport(rows, expectedCount = 10) {
  const errors = [];
  const warnings = [];
  const externalIds = new Set();
  const allowed = {
    difficulty: new Set(["easy", "medium", "hard"]),
    cognitive_level: new Set(["recall", "understanding", "application", "scenario"]),
    question_type: new Set(["multiple_choice", "true_false"]),
    review_status: new Set(["draft", "in_review", "approved", "rejected", "archived"]),
  };

  if (rows.length !== expectedCount) {
    errors.push(`Expected ${expectedCount} rows but found ${rows.length}.`);
  }

  rows.forEach((row, index) => {
    const label = `Row ${index + 2}${row.external_id ? ` (${row.external_id})` : ""}`;
    for (const field of REQUIRED_FIELDS.filter((name) => !OPTIONAL_VALUE_FIELDS.has(name))) {
      if (!row[field]) errors.push(`${label}: ${field} is required.`);
    }
    if (externalIds.has(row.external_id)) errors.push(`${label}: duplicate external_id.`);
    externalIds.add(row.external_id);
    for (const [field, values] of Object.entries(allowed)) {
      if (!values.has(row[field])) errors.push(`${label}: invalid ${field} '${row[field]}'.`);
    }
    if (row.question_type !== "multiple_choice") {
      errors.push(`${label}: this pilot importer accepts only multiple_choice rows.`);
    }
    if (!new Set(["A", "B", "C", "D"]).has(row.correct_letter)) {
      errors.push(`${label}: correct_letter must be A, B, C, or D.`);
    }
    if (row.review_status !== "draft") {
      errors.push(`${label}: pilot imports must remain draft.`);
    }
    if (!parseSourcePages(row.source_pages)) {
      errors.push(`${label}: source_pages must be a positive page or page range.`);
    }
    if (!/^\d+$/.test(row.estimated_time_seconds) || Number(row.estimated_time_seconds) < 1) {
      errors.push(`${label}: estimated_time_seconds must be a positive integer.`);
    }
    if (!/^\d+$/.test(row.feedback_display_version) || Number(row.feedback_display_version) < 1) {
      errors.push(`${label}: feedback_display_version must be a positive integer.`);
    }

    const visualFields = [
      "visual_priority",
      "visual_type",
      "visual_display_mode",
      "visual_asset_key",
      "visual_brief",
      "visual_caption",
      "visual_alt_text",
    ];
    if (visualFields.some((field) => row[field])) {
      for (const field of visualFields) {
        if (!row[field]) errors.push(`${label}: ${field} is required when visual metadata exists.`);
      }
      if (!new Set(["low", "medium", "high"]).has(row.visual_priority)) {
        errors.push(`${label}: invalid visual_priority '${row.visual_priority}'.`);
      }
      if (!/^[a-z][a-z0-9_-]{1,79}$/.test(row.visual_type)) {
        errors.push(`${label}: invalid visual_type '${row.visual_type}'.`);
      }
      if (row.visual_display_mode !== "optional_after_answer") {
        errors.push(`${label}: unsupported visual_display_mode '${row.visual_display_mode}'.`);
      }
    }
  });

  for (const row of rows) {
    for (const target of row.reinforcement_question_ids
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)) {
      if (!externalIds.has(target)) {
        warnings.push(`${row.external_id}: reinforcement target ${target} is outside this file.`);
      }
    }
  }

  return { errors, warnings };
}

module.exports = {
  REQUIRED_FIELDS,
  decodeImportBuffer,
  parseDelimited,
  parseImport,
  parseSourcePages,
  validateImport,
};
