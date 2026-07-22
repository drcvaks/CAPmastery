const fs = require("node:fs");
const path = require("node:path");

const {
  decodeImportBuffer,
  parseImport,
  parseSourcePages,
  validateImport,
} = require("../scripts/lib/pilot-import.cjs");

const inputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "LTL_V1_Chapter_1_Pilot_10_Questions_Complete_Learning_Support.csv",
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
