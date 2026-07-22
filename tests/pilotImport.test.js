const fs = require("node:fs");
const path = require("node:path");

const {
  decodeImportBuffer,
  normalizeCognitiveLevel,
  parseImport,
  parseSourcePages,
  questionPurpose,
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
  "LTL_V1_Chapter_1_Adaptive_Test_30_Questions.csv",
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

  it("accepts thirty unique draft questions and optional blank support", () => {
    const validation = validateImport(rows, 30);

    expect(validation.errors).toEqual([]);
    expect(rows).toHaveLength(30);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(30);
    expect(rows.filter((row) => !row.short_explanation)).toHaveLength(20);
    expect(rows.filter((row) => row.visual_asset_key)).toHaveLength(10);
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

    expect(validation.warnings).toHaveLength(22);
    expect(validation.warnings.every((warning) => warning.includes("outside this file"))).toBe(
      true,
    );
  });
});
