const { createHash } = require("node:crypto");

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
  "common_mistake",
  "short_explanation",
  "memory_aid",
  "visual_priority",
  "visual_type",
  "visual_display_mode",
  "visual_asset_key",
  "visual_brief",
  "visual_caption",
  "visual_alt_text",
]);

const FINAL_EXAM_FIELDS = [
  "chapter_number",
  "exam_likeness",
  "distractor_difficulty",
  "eligible_for_final_exam",
  "final_exam_weight",
  "content_origin",
  "style_reference",
];

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

function parseImport(text, defaults = {}) {
  const matrix = parseDelimited(text.replace(/^\uFEFF/, ""));
  if (matrix.length < 2) throw new Error("The import file has no data rows.");
  const headers = matrix[0];
  const missingHeaders = REQUIRED_FIELDS.filter(
    (field) => !headers.includes(field) && defaults[field] === undefined,
  );
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
  }
  return matrix.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`Row ${index + 2} has ${values.length} fields; expected ${headers.length}.`);
    }
    return {
      ...Object.fromEntries(
        Object.entries(defaults).map(([field, value]) => [field, String(value).trim()]),
      ),
      ...Object.fromEntries(headers.map((header, column) => [header, values[column].trim()])),
    };
  });
}

function parseSourcePages(value) {
  if (String(value).includes(",")) {
    const ranges = String(value)
      .split(",")
      .map((segment) => parseSourcePages(segment.trim()));
    if (ranges.length === 0 || ranges.some((range) => range === null)) return null;
    return {
      start: Math.min(...ranges.map((range) => range.start)),
      end: Math.max(...ranges.map((range) => range.end)),
    };
  }
  const match = value.match(/^(\d+)(?:\s*[-–—]\s*(\d+))?$/u);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);
  return start > 0 && end >= start ? { start, end } : null;
}

function formatSourceReference(reference, pages) {
  const normalizedReference = String(reference).trim();
  const normalizedPages = String(pages).trim();
  if (!normalizedPages || /\b(?:printed\s+)?pages?\b/i.test(normalizedReference)) {
    return normalizedReference;
  }
  const label = normalizedPages.includes(",") || /[-–—]/u.test(normalizedPages) ? "pages" : "page";
  return `${normalizedReference}, ${label} ${normalizedPages}`;
}

function normalizeMetadataCode(value, maxLength = 100) {
  const normalized = String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_.-]+/g, "_");
  if (!normalized || !/^[A-Z0-9]/.test(normalized)) {
    throw new Error(`Metadata code '${value}' cannot be normalized safely.`);
  }
  if (normalized.length <= maxLength) return normalized;

  const hash = createHash("sha256").update(normalized).digest("hex").slice(0, 12).toUpperCase();
  return `${normalized.slice(0, maxLength - hash.length - 1)}.${hash}`;
}

function canonicalQuestionFamilyCode(row) {
  return normalizeMetadataCode(
    [row.objective_code, row.concept_code, row.question_family_code].join("."),
    100,
  );
}

function validateImport(rows, expectedCount = 10) {
  const errors = [];
  const warnings = [];
  const externalIds = new Set();
  const allowed = {
    difficulty: new Set(["easy", "medium", "medium_hard", "hard"]),
    cognitive_level: new Set([
      "recall",
      "recognition",
      "understanding",
      "application",
      "analysis",
      "misconception",
      "scenario",
    ]),
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
    const isFinalExamTagged = FINAL_EXAM_FIELDS.some((field) => row[field] !== undefined);
    if (isFinalExamTagged) {
      for (const field of FINAL_EXAM_FIELDS) {
        if (!row[field]) errors.push(`${label}: ${field} is required for a final-exam import.`);
      }
      if (
        !/^\d+$/.test(row.chapter_number) ||
        Number(row.chapter_number) < 1 ||
        Number(row.chapter_number) > 99
      ) {
        errors.push(`${label}: chapter_number must be an integer from 1 through 99.`);
      }
      if (!new Set(["high", "medium", "low"]).has(row.exam_likeness)) {
        errors.push(`${label}: invalid exam_likeness '${row.exam_likeness}'.`);
      }
      if (!new Set(["basic", "moderate", "close"]).has(row.distractor_difficulty)) {
        errors.push(`${label}: invalid distractor_difficulty '${row.distractor_difficulty}'.`);
      }
      if (!new Set(["true", "false"]).has(row.eligible_for_final_exam)) {
        errors.push(`${label}: eligible_for_final_exam must be true or false.`);
      }
      if (!/^\d+(?:\.\d+)?$/.test(row.final_exam_weight) || Number(row.final_exam_weight) < 0) {
        errors.push(`${label}: final_exam_weight must be a nonnegative number.`);
      }
      if (
        !new Set(["existing_original_bank", "original_textbook_grounded"]).has(row.content_origin)
      ) {
        errors.push(`${label}: invalid content_origin '${row.content_origin}'.`);
      }
      if (
        !new Set([
          "pre_sample_bank_review",
          "Mitchell_sample_style_analysis",
          "Mitchell_Aerospace_sample_style_analysis",
        ]).has(row.style_reference)
      ) {
        errors.push(`${label}: invalid style_reference '${row.style_reference}'.`);
      }
    }
    if (
      row.module_number !== undefined &&
      (!/^\d+$/.test(row.module_number) ||
        Number(row.module_number) < 1 ||
        Number(row.module_number) > 99)
    ) {
      errors.push(`${label}: module_number must be an integer from 1 through 99.`);
    }
    for (const field of ["question_mode", "question_style"]) {
      if (row[field] && !/^[a-z][a-z0-9_-]{1,79}$/.test(row[field])) {
        errors.push(`${label}: invalid ${field} '${row[field]}'.`);
      }
    }

    const optionalSupportFields = [
      "memory_aid",
      "visual_priority",
      "visual_type",
      "visual_display_mode",
      "visual_asset_key",
      "visual_brief",
      "visual_caption",
      "visual_alt_text",
    ];
    if (optionalSupportFields.some((field) => row[field]) && !row.short_explanation) {
      errors.push(`${label}: short_explanation is required when learning support exists.`);
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
      if (!/^[a-z0-9][a-z0-9_-]{2,119}$/.test(normalizeVisualAssetKey(row.visual_asset_key))) {
        errors.push(`${label}: invalid visual_asset_key '${row.visual_asset_key}'.`);
      }
    }

    if (row.show_visual_button !== undefined) {
      if (!new Set(["true", "false"]).has(row.show_visual_button)) {
        errors.push(`${label}: show_visual_button must be true or false.`);
      }
      if (!new Set(["approved", "missing"]).has(row.visual_status)) {
        errors.push(`${label}: visual_status must be approved or missing.`);
      }
      if (row.show_visual_button === "true") {
        if (row.visual_status !== "approved") {
          errors.push(`${label}: enabled visual must have approved status.`);
        }
        if (
          !row.visual_group ||
          row.visual_group !== normalizeVisualAssetKey(row.visual_asset_key)
        ) {
          errors.push(`${label}: visual_group must match the normalized visual_asset_key.`);
        }
        if (!/^[a-z0-9][a-z0-9_.-]{2,199}\.png$/.test(row.visual_file_name)) {
          errors.push(`${label}: enabled visual requires a safe PNG filename.`);
        }
        const normalizedPath = String(row.visual_storage_path).replace(/^\/+/, "");
        if (normalizedPath !== `assets/cap-visuals/${row.visual_file_name}`) {
          errors.push(`${label}: visual_storage_path does not match visual_file_name.`);
        }
      } else if (
        row.visual_status !== "missing" ||
        row.visual_group ||
        row.visual_file_name ||
        row.visual_storage_path
      ) {
        errors.push(`${label}: missing visual must keep its group, filename, and path blank.`);
      }
    }
  });

  if (rows.length === 500 && rows.every((row) => row.chapter_number !== undefined)) {
    for (const chapter of [4, 5, 6, 7, 8]) {
      const chapterRows = rows.filter((row) => Number(row.chapter_number) === chapter);
      const eligibleRows = chapterRows.filter((row) => row.eligible_for_final_exam === "true");
      if (chapterRows.length !== 100) {
        errors.push(`Chapter ${chapter} must contain 100 rows; found ${chapterRows.length}.`);
      }
      if (eligibleRows.length !== 60) {
        errors.push(
          `Chapter ${chapter} must contain 60 final-exam-eligible rows; found ${eligibleRows.length}.`,
        );
      }
    }
  }

  for (const row of rows) {
    for (const target of splitReinforcementIds(row.reinforcement_question_ids)) {
      if (!externalIds.has(target)) {
        warnings.push(`${row.external_id}: reinforcement target ${target} is outside this file.`);
      }
    }
  }

  if (rows.length >= 20) {
    const correctLetterCounts = rows.reduce((counts, row) => {
      counts.set(row.correct_letter, (counts.get(row.correct_letter) ?? 0) + 1);
      return counts;
    }, new Map());
    const [dominantLetter, dominantCount] = [...correctLetterCounts.entries()].sort(
      (left, right) => right[1] - left[1],
    )[0] ?? ["", 0];
    if (dominantCount / rows.length >= 0.6) {
      warnings.push(
        `Answer-key balance warning: ${dominantLetter} is correct for ${dominantCount} of ${rows.length} questions.`,
      );
    }
    const missingLetters = ["A", "B", "C", "D"].filter(
      (letter) => !correctLetterCounts.has(letter),
    );
    if (missingLetters.length > 0) {
      warnings.push(
        `Answer-key coverage warning: ${missingLetters.join(", ")} ${
          missingLetters.length === 1 ? "is" : "are"
        } never correct in this ${rows.length}-question bank.`,
      );
    }
  }

  return { errors, warnings };
}

function normalizeCognitiveLevel(value) {
  if (value === "recognition") return "recall";
  if (value === "analysis") return "application";
  if (value === "misconception") return "understanding";
  return value;
}

function normalizeDifficulty(value) {
  return value === "medium_hard" ? "hard" : value;
}

function normalizeVisualAssetKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function questionPurpose(value) {
  if (value === "scenario") return "scenario_judgment";
  if (value === "misconception") return "misconception_check";
  return value;
}

function splitReinforcementIds(value) {
  return String(value ?? "")
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  FINAL_EXAM_FIELDS,
  REQUIRED_FIELDS,
  canonicalQuestionFamilyCode,
  decodeImportBuffer,
  formatSourceReference,
  parseDelimited,
  parseImport,
  parseSourcePages,
  normalizeCognitiveLevel,
  normalizeDifficulty,
  normalizeVisualAssetKey,
  normalizeMetadataCode,
  questionPurpose,
  splitReinforcementIds,
  validateImport,
};
