const fs = require("node:fs");
const path = require("node:path");

const {
  decodeImportBuffer,
  formatSourceReference,
  normalizeCognitiveLevel,
  parseImport,
  parseSourcePages,
  questionPurpose,
  splitReinforcementIds,
  validateImport,
} = require("../scripts/lib/pilot-import.cjs");

const inputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "LTL_V1_Chapter_1_Pilot_10_Questions_Complete_Learning_Support.csv",
);
const adaptiveInputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "LTL_V1_Chapter_1_Adaptive_Test_30_Questions_Complete_Support.csv",
);
const legacyAdaptiveInputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "LTL_V1_Chapter_1_Adaptive_Test_30_Questions.csv",
);
const chapterFourInputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "LTL_V2_Chapter_4_75_Questions_Complete_Support.csv",
);
const chapterFiveInputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "LTL_V2_Chapter_5_75_Questions_Complete_Support.csv",
);
const chapterSixInputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "LTL_V2_Chapter_6_75_Questions_Complete_Support.csv",
);

describe("Chapter 1 pilot import validation", () => {
  const rows = parseImport(decodeImportBuffer(fs.readFileSync(inputPath)));

  it("parses exactly ten unique complete draft questions", () => {
    const validation = validateImport(rows, 10);

    expect(validation.errors).toEqual([]);
    expect(rows).toHaveLength(10);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(10);
    expect(rows.every((row) => row.review_status === "draft")).toBe(true);
  });

  it("preserves UTF-8 punctuation, four choices, and all feedback fields", () => {
    expect(rows[0].explanation).toContain("team’s needs");
    for (const row of rows) {
      for (const key of ["a", "b", "c", "d"]) {
        expect(row[`choice_${key}`]).not.toBe("");
        expect(row[`choice_${key}_explanation`]).not.toBe("");
      }
      expect(row.short_explanation).not.toBe("");
      expect(row.memory_aid).not.toBe("");
      expect(row.feedback_display_version).toBe("1");
      expect(row.visual_alt_text).not.toBe("");
    }
  });

  it("parses single pages and Unicode page ranges", () => {
    expect(parseSourcePages("7")).toEqual({ start: 7, end: 7 });
    expect(parseSourcePages("6–7")).toEqual({ start: 6, end: 7 });
    expect(parseSourcePages("7–6")).toBeNull();
  });

  it("reports references to questions outside the ten-question sample as warnings", () => {
    const validation = validateImport(rows, 10);

    expect(validation.warnings).toHaveLength(14);
    expect(validation.warnings[0]).toContain("outside this file");
  });

  it("accepts reviewed visual type keys containing underscores or hyphens", () => {
    const validation = validateImport(rows, 10);

    expect(rows.some((row) => row.visual_type === "four-part_icon_card")).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it("rejects invalid answer metadata before database work begins", () => {
    const invalidRows = rows.map((row) => ({ ...row }));
    invalidRows[0].correct_letter = "E";
    invalidRows[0].estimated_time_seconds = "0";
    invalidRows[0].visual_alt_text = "";

    const validation = validateImport(invalidRows, 10);

    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("correct_letter must be A, B, C, or D"),
        expect.stringContaining("estimated_time_seconds must be a positive integer"),
        expect.stringContaining("visual_alt_text is required when visual metadata exists"),
      ]),
    );
  });
});

describe("Chapter 1 adaptive 30-question validation", () => {
  const rows = parseImport(decodeImportBuffer(fs.readFileSync(adaptiveInputPath)));

  it("accepts thirty unique draft questions with complete learning support", () => {
    const validation = validateImport(rows, 30);

    expect(validation.errors).toEqual([]);
    expect(rows).toHaveLength(30);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(30);
    expect(rows.every((row) => row.short_explanation)).toBe(true);
    expect(rows.every((row) => row.memory_aid)).toBe(true);
    expect(rows.every((row) => row.feedback_display_version === "1")).toBe(true);
    expect(rows.every((row) => row.visual_asset_key)).toBe(true);
    expect(new Set(rows.map((row) => row.visual_asset_key)).size).toBe(30);
    expect(rows.every((row) => row.visual_alt_text)).toBe(true);
  });

  it("changes only learning-support fields from the prior adaptive bank", () => {
    const legacyRows = parseImport(decodeImportBuffer(fs.readFileSync(legacyAdaptiveInputPath)));
    const supportFields = new Set([
      "short_explanation",
      "feedback_display_version",
      "memory_aid",
      "visual_priority",
      "visual_type",
      "visual_display_mode",
      "visual_asset_key",
      "visual_brief",
      "visual_caption",
      "visual_alt_text",
    ]);
    const legacyById = new Map(legacyRows.map((row) => [row.external_id, row]));

    for (const row of rows) {
      const legacy = legacyById.get(row.external_id);
      expect(legacy).toBeDefined();
      for (const [field, value] of Object.entries(row)) {
        if (!supportFields.has(field)) expect(value).toBe(legacy[field]);
      }
    }
  });

  it("matches the documented adaptive-bank distribution", () => {
    const count = (field, value) => rows.filter((row) => row[field] === value).length;

    expect(
      ["Pilot A", "Pilot B", "Pilot C", "Pilot D", "Pilot E"].map((value) =>
        count("pilot_batch", value),
      ),
    ).toEqual([6, 6, 6, 6, 6]);
    expect(["easy", "medium", "hard"].map((value) => count("difficulty", value))).toEqual([
      11, 14, 5,
    ]);
    expect(
      ["analysis", "application", "recall", "recognition", "scenario", "understanding"].map(
        (value) => count("cognitive_level", value),
      ),
    ).toEqual([1, 5, 9, 1, 7, 7]);
  });

  it("maps finer cognitive intent into supported delivery categories without losing purpose", () => {
    expect(normalizeCognitiveLevel("recognition")).toBe("recall");
    expect(normalizeCognitiveLevel("analysis")).toBe("application");
    expect(normalizeCognitiveLevel("scenario")).toBe("scenario");
    expect(questionPurpose("recognition")).toBe("recognition");
    expect(questionPurpose("analysis")).toBe("analysis");
    expect(questionPurpose("scenario")).toBe("scenario_judgment");
  });

  it("reports only the documented out-of-bank reinforcement warnings", () => {
    const validation = validateImport(rows, 30);
    const reinforcementWarnings = validation.warnings.filter((warning) =>
      warning.includes("outside this file"),
    );

    expect(reinforcementWarnings).toHaveLength(22);
    expect(reinforcementWarnings.every((warning) => warning.includes("outside this file"))).toBe(
      true,
    );
    expect(validation.warnings).toContain(
      "Answer-key balance warning: B is correct for 21 of 30 questions.",
    );
  });
});

describe("Learn to Lead Volume 2 Chapter 4 validation", () => {
  const inputBuffer = fs.readFileSync(chapterFourInputPath);
  const rows = parseImport(decodeImportBuffer(inputBuffer));

  it("parses the UTF-8 BOM file as exactly 75 unique draft questions", () => {
    const validation = validateImport(rows, 75);

    expect(inputBuffer.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(validation.errors).toEqual([]);
    expect(rows).toHaveLength(75);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(75);
    expect(rows.every((row) => row.review_status === "draft")).toBe(true);
  });

  it("preserves all choices, feedback, memory, and visual metadata", () => {
    for (const row of rows) {
      for (const key of ["a", "b", "c", "d"]) {
        expect(row[`choice_${key}`]).not.toBe("");
        expect(row[`choice_${key}_explanation`]).not.toBe("");
      }
      expect(row.short_explanation).not.toBe("");
      expect(row.explanation).not.toBe("");
      expect(row.memory_aid).not.toBe("");
      expect(row.remediation_text).not.toBe("");
      expect(row.visual_asset_key).not.toBe("");
      expect(row.visual_alt_text).not.toBe("");
    }
    expect(new Set(rows.map((row) => row.visual_asset_key)).size).toBe(75);
  });

  it("retains delivery mode and the supplied harder-question style classifications", () => {
    const count = (field, value) => rows.filter((row) => row[field] === value).length;

    expect(rows.every((row) => row.question_mode === "mixed")).toBe(true);
    expect(
      ["application", "cap_direct", "scenario"].map((value) => count("question_style", value)),
    ).toEqual([20, 35, 20]);
    expect(["easy", "medium", "hard"].map((value) => count("difficulty", value))).toEqual([
      14, 30, 31,
    ]);
  });

  it("maps misconception checks safely and resolves pipe-delimited reinforcement links", () => {
    const externalIds = new Set(rows.map((row) => row.external_id));
    const misconceptionRows = rows.filter((row) => row.cognitive_level === "misconception");
    const reinforcementIds = rows.flatMap((row) =>
      splitReinforcementIds(row.reinforcement_question_ids),
    );

    expect(misconceptionRows.map((row) => row.external_id)).toEqual([
      "LTL2-C4-Q005",
      "LTL2-C4-Q028",
    ]);
    expect(normalizeCognitiveLevel("misconception")).toBe("understanding");
    expect(questionPurpose("misconception")).toBe("misconception_check");
    expect(reinforcementIds).toHaveLength(129);
    expect(reinforcementIds.every((externalId) => externalIds.has(externalId))).toBe(true);
  });

  it("reports the supplied answer-key imbalance without changing any answers", () => {
    const validation = validateImport(rows, 75);
    const correctLetters = Object.fromEntries(
      ["A", "B", "C", "D"].map((letter) => [
        letter,
        rows.filter((row) => row.correct_letter === letter).length,
      ]),
    );

    expect(correctLetters).toEqual({ A: 10, B: 58, C: 7, D: 0 });
    expect(validation.warnings).toEqual([
      "Answer-key balance warning: B is correct for 58 of 75 questions.",
      "Answer-key coverage warning: D is never correct in this 75-question bank.",
    ]);
  });
});

describe("Learn to Lead Volume 2 Chapter 5 validation", () => {
  const inputBuffer = fs.readFileSync(chapterFiveInputPath);
  const rows = parseImport(decodeImportBuffer(inputBuffer));

  it("parses the UTF-8 BOM file as exactly 75 unique draft questions", () => {
    const validation = validateImport(rows, 75);

    expect(inputBuffer.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toEqual([]);
    expect(rows).toHaveLength(75);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(75);
    expect(rows.every((row) => row.review_status === "draft")).toBe(true);
  });

  it("preserves four unique choices and complete learning support for every question", () => {
    for (const row of rows) {
      expect(new Set(["a", "b", "c", "d"].map((key) => row[`choice_${key}`])).size).toBe(4);
      for (const key of ["a", "b", "c", "d"]) {
        expect(row[`choice_${key}_explanation`]).not.toBe("");
      }
      expect(row.short_explanation).not.toBe("");
      expect(row.explanation).not.toBe("");
      expect(row.memory_aid).not.toBe("");
      expect(row.remediation_text).not.toBe("");
      expect(row.visual_asset_key).not.toBe("");
      expect(row.visual_alt_text).not.toBe("");
    }
    expect(new Set(rows.map((row) => row.visual_asset_key)).size).toBe(75);
  });

  it("retains the supplied difficulty, cognitive, mode, and style classifications", () => {
    const count = (field, value) => rows.filter((row) => row[field] === value).length;

    expect(["easy", "medium", "hard"].map((value) => count("difficulty", value))).toEqual([
      18, 37, 20,
    ]);
    expect(
      ["analysis", "application", "misconception", "recall", "recognition", "understanding"].map(
        (value) => count("cognitive_level", value),
      ),
    ).toEqual([4, 12, 5, 10, 37, 7]);
    expect(rows.every((row) => row.question_mode === "study_and_test")).toBe(true);
    expect(
      ["cap_direct", "close_distractors", "scenario", "sequence"].map((value) =>
        count("question_style", value),
      ),
    ).toEqual([58, 6, 10, 1]);
  });

  it("accepts comma-separated citations and preserves their exact display text", () => {
    expect(parseSourcePages("40, 43")).toEqual({ start: 40, end: 43 });
    expect(parseSourcePages("66, 69")).toEqual({ start: 66, end: 69 });
    expect(formatSourceReference("Learn to Lead, Volume 2, Chapter 5, Objective 1", "40, 43")).toBe(
      "Learn to Lead, Volume 2, Chapter 5, Objective 1, pages 40, 43",
    );
    expect(
      formatSourceReference("Learn to Lead Volume 1, Chapter 1, printed pages 6–7", "6–7"),
    ).toBe("Learn to Lead Volume 1, Chapter 1, printed pages 6–7");
  });

  it("resolves all comma-delimited reinforcement links within the supplied bank", () => {
    const externalIds = new Set(rows.map((row) => row.external_id));
    const reinforcementIds = rows.flatMap((row) =>
      splitReinforcementIds(row.reinforcement_question_ids),
    );

    expect(reinforcementIds).toHaveLength(20);
    expect(reinforcementIds.every((externalId) => externalIds.has(externalId))).toBe(true);
  });

  it("retains the supplied answer positions without triggering an imbalance warning", () => {
    expect(
      Object.fromEntries(
        ["A", "B", "C", "D"].map((letter) => [
          letter,
          rows.filter((row) => row.correct_letter === letter).length,
        ]),
      ),
    ).toEqual({ A: 21, B: 30, C: 20, D: 4 });
  });
});

describe("Learn to Lead Volume 2 Chapter 6 validation", () => {
  const inputBuffer = fs.readFileSync(chapterSixInputPath);
  const rows = parseImport(decodeImportBuffer(inputBuffer));

  it("parses the UTF-8 BOM file as exactly 75 unique draft questions", () => {
    const validation = validateImport(rows, 75);

    expect(inputBuffer.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(validation.errors).toEqual([]);
    expect(rows).toHaveLength(75);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(75);
    expect(rows.every((row) => row.review_status === "draft")).toBe(true);
  });

  it("preserves four unique choices and complete learning support for every question", () => {
    for (const row of rows) {
      expect(new Set(["a", "b", "c", "d"].map((key) => row[`choice_${key}`])).size).toBe(4);
      for (const key of ["a", "b", "c", "d"]) {
        expect(row[`choice_${key}_explanation`]).not.toBe("");
      }
      expect(row.short_explanation).not.toBe("");
      expect(row.explanation).not.toBe("");
      expect(row.memory_aid).not.toBe("");
      expect(row.remediation_text).not.toBe("");
      expect(row.visual_asset_key).not.toBe("");
      expect(row.visual_alt_text).not.toBe("");
    }
    expect(new Set(rows.map((row) => row.visual_asset_key)).size).toBe(75);
  });

  it("retains the supplied difficulty, cognitive, mode, and style classifications", () => {
    const count = (field, value) => rows.filter((row) => row[field] === value).length;

    expect(["easy", "medium", "hard"].map((value) => count("difficulty", value))).toEqual([
      9, 36, 30,
    ]);
    expect(
      ["analysis", "application", "misconception", "recall", "scenario", "understanding"].map(
        (value) => count("cognitive_level", value),
      ),
    ).toEqual([14, 23, 4, 14, 8, 12]);
    expect(rows.every((row) => row.question_mode === "study_and_test")).toBe(true);
    expect(
      ["analysis", "application", "cap_direct", "scenario"].map((value) =>
        count("question_style", value),
      ),
    ).toEqual([2, 6, 44, 23]);
  });

  it("resolves all reinforcement links within the supplied bank", () => {
    const externalIds = new Set(rows.map((row) => row.external_id));
    const reinforcementIds = rows.flatMap((row) =>
      splitReinforcementIds(row.reinforcement_question_ids),
    );

    expect(reinforcementIds).toHaveLength(225);
    expect(reinforcementIds.every((externalId) => externalIds.has(externalId))).toBe(true);
  });

  it("preserves the supplied answer positions and reports the missing D position", () => {
    const validation = validateImport(rows, 75);

    expect(
      Object.fromEntries(
        ["A", "B", "C", "D"].map((letter) => [
          letter,
          rows.filter((row) => row.correct_letter === letter).length,
        ]),
      ),
    ).toEqual({ A: 25, B: 39, C: 11, D: 0 });
    expect(validation.warnings).toEqual([
      "Answer-key coverage warning: D is never correct in this 75-question bank.",
    ]);
  });
});
