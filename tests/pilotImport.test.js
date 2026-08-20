const fs = require("node:fs");
const path = require("node:path");

const {
  canonicalQuestionFamilyCode,
  decodeImportBuffer,
  formatSourceReference,
  normalizeCognitiveLevel,
  normalizeDifficulty,
  normalizeVisualAssetKey,
  normalizeMetadataCode,
  parseImport,
  parseSourcePages,
  questionPurpose,
  splitReinforcementIds,
  validateImport,
} = require("../scripts/lib/pilot-import.cjs");
const {
  normalizeStoragePath,
  parseVisualManifest,
  readPngDimensions,
  validateVisualManifest,
} = require("../scripts/lib/visual-assets.cjs");

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
const chapterSevenInputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "LTL_V2_Chapter_7_75_Questions_Complete_Support.csv",
);
const chapterEightInputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "LTL_V2_Chapter_8_75_Questions_Complete_Support.csv",
);
const mitchell500InputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "LTL_V2_Chapters_4_8_500_Questions_Final_Exam_Tagged.csv",
);
const aerospaceModuleOneInputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "Aerospace",
  "Aerospace_Dimensions_Module_1_100_Questions_Complete_Support.csv",
);
const aerospaceModuleOneVisualInputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "Aerospace",
  "Aerospace_Dimensions_Module_1_100_Questions_With_Visual_Assets.csv",
);
const aerospaceModuleOneVisualManifestPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "Aerospace",
  "Aerospace_Dimensions_Module_1_Visual_Asset_Manifest.csv",
);
const aerospaceModuleOneDefaults = {
  pilot_batch: "AD_M1_100",
  feedback_display_version: "1",
  common_mistake: "",
  source_status: "approved_source",
};
const aerospaceModuleTwoInputPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "Aerospace",
  "Aerospace_Dimensions_Module_2_100_Questions_Complete_Support.csv",
);
const aerospaceModuleTwoVisualManifestPath = path.resolve(
  __dirname,
  "..",
  "Content",
  "Aerospace",
  "Aerospace_Dimensions_Module_2_Visual_Asset_Manifest.csv",
);
const aerospaceModuleTwoDefaults = {
  pilot_batch: "AD_M2_100",
  feedback_display_version: "1",
  common_mistake: "",
  source_status: "approved_source",
};
const aerospaceModuleThreeDirectory = path.resolve(
  __dirname,
  "..",
  "Content",
  "Aerospace",
  "Aerospace_Module_3",
);
const aerospaceModuleThreeInputPath = path.join(
  aerospaceModuleThreeDirectory,
  "Aerospace_Dimensions_Module_3_100_Questions_Complete_Support.csv",
);
const aerospaceModuleThreeVisualManifestPath = path.join(
  aerospaceModuleThreeDirectory,
  "Aerospace_Dimensions_Module_3_Visual_Asset_Manifest.csv",
);
const aerospaceModuleThreeDefaults = {
  pilot_batch: "AD_M3_100",
  feedback_display_version: "1",
  common_mistake: "",
  source_status: "approved_source",
};
const aerospaceModuleFourDirectory = path.resolve(
  __dirname,
  "..",
  "Content",
  "Aerospace",
  "Aerospace_Module_4",
);
const aerospaceModuleFourInputPath = path.join(
  aerospaceModuleFourDirectory,
  "Aerospace_Dimensions_Module_4_100_Questions_Complete_Support.csv",
);
const aerospaceModuleFourVisualManifestPath = path.join(
  aerospaceModuleFourDirectory,
  "Aerospace_Dimensions_Module_4_Visual_Asset_Manifest.csv",
);
const aerospaceModuleFourDefaults = {
  pilot_batch: "AD_M4_100",
  feedback_display_version: "1",
  common_mistake: "",
  source_status: "approved_source",
};
const aerospaceModuleFiveDirectory = path.resolve(
  __dirname,
  "..",
  "Content",
  "Aerospace",
  "Aerospace_Module_5",
);
const aerospaceModuleFiveInputPath = path.join(
  aerospaceModuleFiveDirectory,
  "Aerospace_Dimensions_Module_5_100_Questions_Complete_Support.csv",
);
const aerospaceModuleFiveVisualManifestPath = path.join(
  aerospaceModuleFiveDirectory,
  "Aerospace_Dimensions_Module_5_Visual_Asset_Manifest.csv",
);
const aerospaceModuleFiveDefaults = {
  pilot_batch: "AD_M5_100",
  feedback_display_version: "1",
  common_mistake: "",
  source_status: "approved_source",
};
const aerospaceModuleFiveAliases = {
  content_origin: {
    Aerospace_Dimensions_Module_5_source_grounded: "original_textbook_grounded",
  },
  style_reference: {
    Module_4_100_question_bank_style: "Mitchell_Aerospace_sample_style_analysis",
  },
  visual_priority: { recommended: "medium" },
  visual_display_mode: { optional_modal: "optional_after_answer" },
};
const aerospaceModuleSixDirectory = path.resolve(
  __dirname,
  "..",
  "Content",
  "Aerospace",
  "Aerospace_Module_6",
);
const aerospaceModuleSixInputPath = path.join(
  aerospaceModuleSixDirectory,
  "Aerospace_Dimensions_Module_6_100_Questions_Complete_Support.csv",
);
const aerospaceModuleSixVisualManifestPath = path.join(
  aerospaceModuleSixDirectory,
  "Aerospace_Dimensions_Module_6_Visual_Asset_Manifest.csv",
);
const aerospaceModuleSixDefaults = {
  pilot_batch: "AD_M6_100",
  feedback_display_version: "1",
  common_mistake: "",
  source_status: "approved_source",
};

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

describe("Learn to Lead Volume 2 combined final-exam bank", () => {
  const inputBuffer = fs.readFileSync(mitchell500InputPath);
  const rows = parseImport(decodeImportBuffer(inputBuffer));

  it("validates 500 unique draft rows with the documented chapter and eligibility counts", () => {
    const validation = validateImport(rows, 500);

    expect(inputBuffer.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(validation.errors).toEqual([]);
    expect(rows).toHaveLength(500);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(500);
    for (const chapter of [4, 5, 6, 7, 8]) {
      const chapterRows = rows.filter((row) => Number(row.chapter_number) === chapter);
      expect(chapterRows).toHaveLength(100);
      expect(chapterRows.filter((row) => row.eligible_for_final_exam === "true")).toHaveLength(60);
      expect(
        chapterRows.filter((row) => row.content_origin === "original_textbook_grounded"),
      ).toHaveLength(25);
    }
  });

  it("preserves every field of the existing 75-question chapter banks", () => {
    const combinedById = new Map(rows.map((row) => [row.external_id, row]));
    for (const oldPath of [
      chapterFourInputPath,
      chapterFiveInputPath,
      chapterSixInputPath,
      chapterSevenInputPath,
      chapterEightInputPath,
    ]) {
      const oldRows = parseImport(decodeImportBuffer(fs.readFileSync(oldPath)));
      for (const oldRow of oldRows) {
        const combined = combinedById.get(oldRow.external_id);
        expect(combined).toBeDefined();
        for (const [field, value] of Object.entries(oldRow)) {
          expect(combined[field]).toBe(value);
        }
      }
    }
  });

  it("keeps all choices, explanations, support, and classification fields complete", () => {
    for (const row of rows) {
      expect(["A", "B", "C", "D"]).toContain(row.correct_letter);
      for (const key of ["a", "b", "c", "d"]) {
        expect(row[`choice_${key}`]).not.toBe("");
        expect(row[`choice_${key}_explanation`]).not.toBe("");
      }
      expect(row.explanation).not.toBe("");
      expect(row.short_explanation).not.toBe("");
      expect(row.memory_aid).not.toBe("");
      expect(row.remediation_text).not.toBe("");
      expect(row.source_pages).not.toBe("");
      expect(["high", "medium", "low"]).toContain(row.exam_likeness);
      expect(["basic", "moderate", "close"]).toContain(row.distractor_difficulty);
    }
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

describe("Learn to Lead Volume 2 Chapter 7 validation", () => {
  const inputBuffer = fs.readFileSync(chapterSevenInputPath);
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
      0, 47, 28,
    ]);
    expect(
      ["analysis", "misconception", "recall", "recognition", "scenario", "understanding"].map(
        (value) => count("cognitive_level", value),
      ),
    ).toEqual([6, 1, 2, 1, 6, 59]);
    expect(rows.every((row) => row.question_mode === "both")).toBe(true);
    expect(["cap_direct", "scenario"].map((value) => count("question_style", value))).toEqual([
      69, 6,
    ]);
  });

  it("resolves all reinforcement links within the supplied bank", () => {
    const externalIds = new Set(rows.map((row) => row.external_id));
    const reinforcementIds = rows.flatMap((row) =>
      splitReinforcementIds(row.reinforcement_question_ids),
    );

    expect(reinforcementIds).toHaveLength(150);
    expect(reinforcementIds.every((externalId) => externalIds.has(externalId))).toBe(true);
  });

  it("normalizes only database metadata keys while keeping them stable and unique", () => {
    const rawFamilies = new Set(
      rows.map((row) => [row.objective_code, row.concept_code, row.question_family_code].join(".")),
    );
    const canonicalFamilies = new Set(rows.map(canonicalQuestionFamilyCode));

    expect(canonicalFamilies.size).toBe(rawFamilies.size);
    expect(
      [...canonicalFamilies].every(
        (code) => code.length <= 100 && /^[A-Z0-9][A-Z0-9_.-]{0,99}$/.test(code),
      ),
    ).toBe(true);
    expect(normalizeMetadataCode("LTL2-C7-GRID_9,1")).toBe("LTL2-C7-GRID_9_1");
    expect(
      canonicalQuestionFamilyCode(rows.find((row) => row.external_id === "LTL2-C7-PC-Q003")),
    ).toHaveLength(100);
  });

  it("preserves supplied answers and reports the concentrated A position", () => {
    const validation = validateImport(rows, 75);

    expect(
      Object.fromEntries(
        ["A", "B", "C", "D"].map((letter) => [
          letter,
          rows.filter((row) => row.correct_letter === letter).length,
        ]),
      ),
    ).toEqual({ A: 46, B: 25, C: 3, D: 1 });
    expect(validation.warnings).toEqual([
      "Answer-key balance warning: A is correct for 46 of 75 questions.",
    ]);
  });
});

describe("Learn to Lead Volume 2 Chapter 8 validation", () => {
  const inputBuffer = fs.readFileSync(chapterEightInputPath);
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
      4, 47, 24,
    ]);
    expect(
      ["analysis", "application", "recall", "recognition", "scenario", "understanding"].map(
        (value) => count("cognitive_level", value),
      ),
    ).toEqual([9, 15, 14, 8, 3, 26]);
    expect(rows.every((row) => row.question_mode === "both")).toBe(true);
    expect(["cap_direct", "scenario"].map((value) => count("question_style", value))).toEqual([
      72, 3,
    ]);
  });

  it("resolves all reinforcement links and metadata keys within the supplied bank", () => {
    const externalIds = new Set(rows.map((row) => row.external_id));
    const reinforcementIds = rows.flatMap((row) =>
      splitReinforcementIds(row.reinforcement_question_ids),
    );
    const rawFamilies = new Set(
      rows.map((row) => [row.objective_code, row.concept_code, row.question_family_code].join(".")),
    );
    const canonicalFamilies = new Set(rows.map(canonicalQuestionFamilyCode));

    expect(reinforcementIds).toHaveLength(150);
    expect(reinforcementIds.every((externalId) => externalIds.has(externalId))).toBe(true);
    expect(canonicalFamilies.size).toBe(rawFamilies.size);
    expect(
      [...canonicalFamilies].every(
        (code) => code.length <= 100 && /^[A-Z0-9][A-Z0-9_.-]{0,99}$/.test(code),
      ),
    ).toBe(true);
  });

  it("preserves the supplied balanced answer positions", () => {
    expect(
      Object.fromEntries(
        ["A", "B", "C", "D"].map((letter) => [
          letter,
          rows.filter((row) => row.correct_letter === letter).length,
        ]),
      ),
    ).toEqual({ A: 20, B: 20, C: 17, D: 18 });
  });
});

describe("Aerospace Dimensions Module 1 validation", () => {
  const inputBuffer = fs.readFileSync(aerospaceModuleOneInputPath);
  const rows = parseImport(decodeImportBuffer(inputBuffer), aerospaceModuleOneDefaults);

  it("parses one hundred unique draft rows using only documented import defaults", () => {
    const validation = validateImport(rows, 100);

    expect(inputBuffer.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toEqual([]);
    expect(rows).toHaveLength(100);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(100);
    expect(rows.every((row) => row.review_status === "draft")).toBe(true);
    expect(rows.every((row) => row.feedback_display_version === "1")).toBe(true);
    expect(rows.every((row) => row.common_mistake === "")).toBe(true);
  });

  it("preserves the module and documented three-chapter distribution", () => {
    expect(rows.every((row) => row.module_number === "1")).toBe(true);
    expect(
      Object.fromEntries(
        ["1", "2", "3"].map((chapter) => [
          chapter,
          rows.filter((row) => row.chapter_number === chapter).length,
        ]),
      ),
    ).toEqual({ 1: 60, 2: 24, 3: 16 });
    expect(
      new Set(rows.filter((row) => row.chapter_number === "1").map((row) => row.chapter_title)),
    ).toEqual(new Set(["Flight"]));
    expect(
      new Set(rows.filter((row) => row.chapter_number === "2").map((row) => row.chapter_title)),
    ).toEqual(new Set(["Rising Air"]));
    expect(
      new Set(rows.filter((row) => row.chapter_number === "3").map((row) => row.chapter_title)),
    ).toEqual(new Set(["Balloons"]));
  });

  it("retains all choices, explanations, learning support, and visual metadata", () => {
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
    expect(new Set(rows.map((row) => row.visual_asset_key)).size).toBe(100);
    const normalizedAssetKeys = rows.map((row) => normalizeVisualAssetKey(row.visual_asset_key));
    expect(new Set(normalizedAssetKeys).size).toBe(100);
    expect(normalizedAssetKeys.every((key) => /^[a-z0-9][a-z0-9_-]{2,119}$/.test(key))).toBe(true);
  });

  it("maps medium-hard difficulty safely while preserving test-style classifications", () => {
    expect(rows.filter((row) => row.difficulty === "medium")).toHaveLength(50);
    expect(rows.filter((row) => row.difficulty === "medium_hard")).toHaveLength(50);
    expect(rows.filter((row) => normalizeDifficulty(row.difficulty) === "hard")).toHaveLength(50);
    expect(rows.filter((row) => row.cognitive_level === "recall")).toHaveLength(50);
    expect(rows.filter((row) => row.cognitive_level === "application")).toHaveLength(50);
    expect(rows.filter((row) => row.question_style === "direct_definition")).toHaveLength(50);
    expect(rows.filter((row) => row.question_style === "brief_application")).toHaveLength(50);
  });

  it("contains seventy-five eligible questions and fifty paired families", () => {
    expect(rows.filter((row) => row.eligible_for_final_exam === "true")).toHaveLength(75);
    expect(new Set(rows.map((row) => row.question_family_code)).size).toBe(50);
    expect(new Set(rows.map((row) => row.objective_code)).size).toBe(50);
    expect(new Set(rows.map((row) => row.concept_code)).size).toBe(50);
  });

  it("keeps every reinforcement link inside its two-question family", () => {
    const byId = new Map(rows.map((row) => [row.external_id, row]));
    const links = rows.flatMap((row) =>
      splitReinforcementIds(row.reinforcement_question_ids).map((target) => [row, target]),
    );

    expect(links).toHaveLength(100);
    for (const [row, target] of links) {
      expect(byId.has(target)).toBe(true);
      expect(byId.get(target).question_family_code).toBe(row.question_family_code);
    }
  });

  it("preserves the supplied balanced answer-key distribution", () => {
    expect(
      Object.fromEntries(
        ["A", "B", "C", "D"].map((letter) => [
          letter,
          rows.filter((row) => row.correct_letter === letter).length,
        ]),
      ),
    ).toEqual({ A: 27, B: 19, C: 23, D: 31 });
  });
});

describe("Aerospace Dimensions Module 1 shared visual integration", () => {
  const assetDirectory = path.dirname(aerospaceModuleOneVisualInputPath);
  const originalRows = parseImport(
    decodeImportBuffer(fs.readFileSync(aerospaceModuleOneInputPath)),
    aerospaceModuleOneDefaults,
  );
  const rows = parseImport(
    decodeImportBuffer(fs.readFileSync(aerospaceModuleOneVisualInputPath)),
    aerospaceModuleOneDefaults,
  );
  const manifest = parseVisualManifest(fs.readFileSync(aerospaceModuleOneVisualManifestPath));

  it("validates one hundred stable question upserts and the supported visual controls", () => {
    expect(validateImport(rows, 100).errors).toEqual([]);
    expect(rows).toHaveLength(100);
    expect(rows.map((row) => row.external_id)).toEqual(originalRows.map((row) => row.external_id));
    expect(rows.filter((row) => row.show_visual_button === "true")).toHaveLength(94);
    expect(rows.filter((row) => row.visual_status === "approved")).toHaveLength(94);
    expect(rows.filter((row) => row.show_visual_button === "false")).toHaveLength(6);
    expect(rows.filter((row) => row.visual_status === "missing")).toHaveLength(6);
  });

  it("changes visual support only and preserves assessment content", () => {
    const visualFields = new Set([
      "visual_priority",
      "visual_type",
      "visual_display_mode",
      "visual_asset_key",
      "visual_brief",
      "visual_caption",
      "visual_alt_text",
      "visual_group",
      "visual_file_name",
      "visual_storage_path",
      "visual_status",
      "show_visual_button",
    ]);
    for (const [index, original] of originalRows.entries()) {
      const updated = rows[index];
      for (const field of Object.keys(original)) {
        if (!visualFields.has(field)) expect(updated[field]).toBe(original[field]);
      }
    }
  });

  it("maps ninety-four questions to the six reviewed shared assets", () => {
    const expectedCounts = Object.fromEntries(
      manifest.map((asset) => [asset.visual_asset_key, Number(asset.question_count)]),
    );
    const actualCounts = Object.fromEntries(
      Object.keys(expectedCounts).map((assetKey) => [
        assetKey,
        rows.filter((row) => row.visual_asset_key === assetKey).length,
      ]),
    );

    expect(manifest).toHaveLength(6);
    expect(actualCounts).toEqual(expectedCounts);
    expect(Object.values(actualCounts).reduce((sum, count) => sum + count, 0)).toBe(94);
  });

  it("validates every PNG and normalizes manifest paths for Supabase Storage", () => {
    expect(validateVisualManifest(manifest, assetDirectory)).toEqual([]);
    for (const asset of manifest) {
      expect(normalizeStoragePath(asset.visual_storage_path)).toBe(
        `assets/cap-visuals/${asset.visual_file_name}`,
      );
      expect(
        readPngDimensions(fs.readFileSync(path.join(assetDirectory, asset.visual_file_name))),
      ).toEqual({ width: 1536, height: 1024 });
    }
  });
});

describe("Aerospace Dimensions Module 2 validation and visual integration", () => {
  const inputBuffer = fs.readFileSync(aerospaceModuleTwoInputPath);
  const assetDirectory = path.dirname(aerospaceModuleTwoInputPath);
  const rows = parseImport(decodeImportBuffer(inputBuffer), aerospaceModuleTwoDefaults);
  const manifest = parseVisualManifest(fs.readFileSync(aerospaceModuleTwoVisualManifestPath));

  it("parses one hundred stable, valid Module 2 draft questions", () => {
    const validation = validateImport(rows, 100);

    expect(inputBuffer.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toEqual([]);
    expect(rows).toHaveLength(100);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(100);
    expect(rows.every((row) => row.module_number === "2")).toBe(true);
    expect(rows.every((row) => row.review_status === "draft")).toBe(true);
  });

  it("preserves the documented three-chapter organization", () => {
    expect(
      Object.fromEntries(
        ["1", "2", "3"].map((chapter) => [
          chapter,
          rows.filter((row) => row.chapter_number === chapter).length,
        ]),
      ),
    ).toEqual({ 1: 52, 2: 32, 3: 16 });
    expect(
      new Set(rows.filter((row) => row.chapter_number === "1").map((row) => row.chapter_title)),
    ).toEqual(new Set(["Airplane Systems"]));
    expect(
      new Set(rows.filter((row) => row.chapter_number === "2").map((row) => row.chapter_title)),
    ).toEqual(new Set(["Airports"]));
    expect(
      new Set(rows.filter((row) => row.chapter_number === "3").map((row) => row.chapter_title)),
    ).toEqual(new Set(["Aeronautical Charts"]));
  });

  it("retains complete answer feedback and learning support", () => {
    for (const row of rows) {
      expect(new Set(["a", "b", "c", "d"].map((key) => row[`choice_${key}`])).size).toBe(4);
      for (const key of ["a", "b", "c", "d"]) {
        expect(row[`choice_${key}_explanation`]).not.toBe("");
      }
      expect(row.short_explanation).not.toBe("");
      expect(row.explanation).not.toBe("");
      expect(row.memory_aid).not.toBe("");
      expect(row.remediation_text).not.toBe("");
      expect(row.show_visual_button).toBe("true");
      expect(row.visual_status).toBe("approved");
    }
  });

  it("contains seventy-five exam-eligible questions and fifty sibling families", () => {
    expect(rows.filter((row) => row.eligible_for_final_exam === "true")).toHaveLength(75);
    expect(new Set(rows.map((row) => row.question_family_code)).size).toBe(50);
    const byId = new Map(rows.map((row) => [row.external_id, row]));
    const links = rows.flatMap((row) =>
      splitReinforcementIds(row.reinforcement_question_ids).map((target) => [row, target]),
    );
    expect(links).toHaveLength(100);
    for (const [row, target] of links) {
      expect(byId.get(target)?.question_family_code).toBe(row.question_family_code);
    }
  });

  it("maps every question to the seven reviewed shared assets", () => {
    const expectedCounts = Object.fromEntries(
      manifest.map((asset) => [asset.visual_asset_key, Number(asset.question_count)]),
    );
    const actualCounts = Object.fromEntries(
      Object.keys(expectedCounts).map((assetKey) => [
        assetKey,
        rows.filter((row) => row.visual_asset_key === assetKey).length,
      ]),
    );

    expect(manifest).toHaveLength(7);
    expect(actualCounts).toEqual(expectedCounts);
    expect(Object.values(actualCounts).reduce((sum, count) => sum + count, 0)).toBe(100);
  });

  it("validates all seven PNG files and private Storage paths", () => {
    expect(
      validateVisualManifest(manifest, assetDirectory, {
        expectedAssetCount: 7,
        expectedQuestionCount: 100,
      }),
    ).toEqual([]);
    for (const asset of manifest) {
      expect(normalizeStoragePath(asset.visual_storage_path)).toBe(
        `assets/cap-visuals/${asset.visual_file_name}`,
      );
      expect(
        readPngDimensions(fs.readFileSync(path.join(assetDirectory, asset.visual_file_name))),
      ).toEqual({ width: 1600, height: 1000 });
    }
  });
});

describe("Aerospace Dimensions Module 3 validation and visual integration", () => {
  const inputBuffer = fs.readFileSync(aerospaceModuleThreeInputPath);
  const rows = parseImport(decodeImportBuffer(inputBuffer), aerospaceModuleThreeDefaults);
  const manifest = parseVisualManifest(fs.readFileSync(aerospaceModuleThreeVisualManifestPath));

  it("accepts the comma-delimited BOM source as one hundred unique draft rows", () => {
    const validation = validateImport(rows, 100);
    expect(inputBuffer.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(validation).toEqual({ errors: [], warnings: [] });
    expect(rows).toHaveLength(100);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(100);
    expect(rows.every((row) => row.module_number === "3" && row.review_status === "draft")).toBe(
      true,
    );
  });

  it("preserves the five-chapter organization from the source", () => {
    expect(
      Object.fromEntries(
        ["1", "2", "3", "4", "5"].map((chapter) => [
          chapter,
          rows.filter((row) => row.chapter_number === chapter).length,
        ]),
      ),
    ).toEqual({ 1: 24, 2: 24, 3: 22, 4: 14, 5: 16 });
    expect(new Set(rows.map((row) => row.chapter_title))).toEqual(
      new Set([
        "The Atmosphere",
        "Air Circulation",
        "Weather Elements",
        "Moisture and Clouds",
        "Weather Systems and Severe Weather",
      ]),
    );
  });

  it("retains complete feedback, support, eligibility, and sibling links", () => {
    const byId = new Map(rows.map((row) => [row.external_id, row]));
    expect(rows.filter((row) => row.eligible_for_final_exam === "true")).toHaveLength(75);
    expect(new Set(rows.map((row) => row.question_family_code)).size).toBe(50);
    for (const row of rows) {
      expect(new Set(["a", "b", "c", "d"].map((key) => row[`choice_${key}`])).size).toBe(4);
      for (const key of ["a", "b", "c", "d"]) {
        expect(row[`choice_${key}_explanation`]).not.toBe("");
      }
      expect(row.memory_aid).not.toBe("");
      expect(row.short_explanation).not.toBe("");
      expect(row.show_visual_button).toBe("true");
      for (const target of splitReinforcementIds(row.reinforcement_question_ids)) {
        expect(byId.get(target)?.question_family_code).toBe(row.question_family_code);
      }
    }
  });

  it("maps all questions exactly to the seven manifest assets", () => {
    const actualCounts = Object.fromEntries(
      manifest.map((asset) => [
        asset.visual_asset_key,
        rows.filter((row) => row.visual_asset_key === asset.visual_asset_key).length,
      ]),
    );
    expect(manifest).toHaveLength(7);
    expect(actualCounts).toEqual({
      module3_atmosphere_layers: 24,
      module3_solar_heating_seasons: 14,
      module3_coriolis_winds_jetstream: 10,
      module3_weather_elements_heat_transfer: 22,
      module3_moisture_clouds: 14,
      module3_fronts_air_masses: 10,
      module3_severe_weather_safety: 6,
    });
    expect(Object.values(actualCounts).reduce((sum, count) => sum + count, 0)).toBe(100);
  });

  it("normalizes the alternate manifest contract and validates all PNG files", () => {
    expect(
      validateVisualManifest(manifest, aerospaceModuleThreeDirectory, {
        expectedAssetCount: 7,
        expectedQuestionCount: null,
      }),
    ).toEqual([]);
    for (const asset of manifest) {
      expect(asset.visual_group).toBe(asset.visual_asset_key);
      expect(asset.visual_status).toBe("approved");
      expect(asset.visual_alt_text).toBe(asset.visual_description);
      expect(normalizeStoragePath(asset.visual_storage_path)).toBe(
        `assets/cap-visuals/${asset.visual_file_name}`,
      );
      expect(
        readPngDimensions(
          fs.readFileSync(path.join(aerospaceModuleThreeDirectory, asset.visual_file_name)),
        ),
      ).toEqual({ width: 1448, height: 1086 });
    }
  });
});

describe("Aerospace Dimensions Module 4 validation and visual integration", () => {
  const inputBuffer = fs.readFileSync(aerospaceModuleFourInputPath);
  const rows = parseImport(decodeImportBuffer(inputBuffer), aerospaceModuleFourDefaults);
  const manifest = parseVisualManifest(fs.readFileSync(aerospaceModuleFourVisualManifestPath));

  it("accepts the comma-delimited BOM source as one hundred unique draft rows", () => {
    expect(inputBuffer.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(validateImport(rows, 100)).toEqual({ errors: [], warnings: [] });
    expect(rows).toHaveLength(100);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(100);
    expect(
      rows.every(
        (row) =>
          row.module_number === "4" &&
          row.package_code === "AD_M4_100" &&
          row.review_status === "draft",
      ),
    ).toBe(true);
  });

  it("preserves the three-chapter organization from the source", () => {
    expect(
      Object.fromEntries(
        ["1", "2", "3"].map((chapter) => [
          chapter,
          rows.filter((row) => row.chapter_number === chapter).length,
        ]),
      ),
    ).toEqual({ 1: 42, 2: 42, 3: 16 });
    expect(new Set(rows.map((row) => row.chapter_title))).toEqual(
      new Set([
        "History of Rockets",
        "Rocket Principles, Systems and Engines",
        "Rocket and Private Space Travel",
      ]),
    );
  });

  it("retains complete feedback, support, eligibility, and sibling links", () => {
    const byId = new Map(rows.map((row) => [row.external_id, row]));
    expect(rows.filter((row) => row.eligible_for_final_exam === "true")).toHaveLength(75);
    expect(new Set(rows.map((row) => row.question_family_code)).size).toBe(50);
    for (const row of rows) {
      expect(new Set(["a", "b", "c", "d"].map((key) => row[`choice_${key}`])).size).toBe(4);
      for (const key of ["a", "b", "c", "d"]) {
        expect(row[`choice_${key}_explanation`]).not.toBe("");
      }
      expect(row.memory_aid).not.toBe("");
      expect(row.short_explanation).not.toBe("");
      expect(row.show_visual_button).toBe("true");
      for (const target of splitReinforcementIds(row.reinforcement_question_ids)) {
        expect(byId.get(target)?.question_family_code).toBe(row.question_family_code);
      }
    }
  });

  it("maps all questions exactly to the seven manifest assets", () => {
    const actualCounts = Object.fromEntries(
      manifest.map((asset) => [
        asset.visual_asset_key,
        rows.filter((row) => row.visual_asset_key === asset.visual_asset_key).length,
      ]),
    );
    expect(manifest).toHaveLength(7);
    expect(actualCounts).toEqual({
      module4_history_timeline: 12,
      module4_modern_rocketry_pioneers: 10,
      module4_space_race_launches: 20,
      module4_newton_rocket_forces: 16,
      module4_rocket_systems_controls: 10,
      module4_propulsion_staging: 12,
      module4_land_speed_private_space: 20,
    });
    expect(Object.values(actualCounts).reduce((sum, count) => sum + count, 0)).toBe(100);
  });

  it("normalizes the manifest contract and validates all PNG files", () => {
    expect(
      validateVisualManifest(manifest, aerospaceModuleFourDirectory, {
        expectedAssetCount: 7,
        expectedQuestionCount: null,
      }),
    ).toEqual([]);
    for (const asset of manifest) {
      expect(asset.visual_group).toBe(asset.visual_asset_key);
      expect(asset.visual_status).toBe("approved");
      expect(asset.visual_alt_text).toBe(asset.visual_description);
      expect(normalizeStoragePath(asset.visual_storage_path)).toBe(
        `assets/cap-visuals/${asset.visual_file_name}`,
      );
      expect(
        readPngDimensions(
          fs.readFileSync(path.join(aerospaceModuleFourDirectory, asset.visual_file_name)),
        ),
      ).toEqual({ width: 1586, height: 992 });
    }
  });
});

describe("Aerospace Dimensions Module 5 validation and visual integration", () => {
  const inputBuffer = fs.readFileSync(aerospaceModuleFiveInputPath);
  const decodedInput = decodeImportBuffer(inputBuffer);
  const rows = parseImport(decodedInput, aerospaceModuleFiveDefaults, aerospaceModuleFiveAliases);
  const manifest = parseVisualManifest(fs.readFileSync(aerospaceModuleFiveVisualManifestPath));

  it("normalizes only the four documented source labels into controlled values", () => {
    const rawRows = parseImport(decodedInput, aerospaceModuleFiveDefaults);
    expect(new Set(rawRows.map((row) => row.content_origin))).toEqual(
      new Set(["Aerospace_Dimensions_Module_5_source_grounded"]),
    );
    expect(new Set(rows.map((row) => row.content_origin))).toEqual(
      new Set(["original_textbook_grounded"]),
    );
    expect(new Set(rows.map((row) => row.style_reference))).toEqual(
      new Set(["Mitchell_Aerospace_sample_style_analysis"]),
    );
    expect(new Set(rows.map((row) => row.visual_priority))).toEqual(new Set(["medium", "high"]));
    expect(new Set(rows.map((row) => row.visual_display_mode))).toEqual(
      new Set(["optional_after_answer"]),
    );
  });

  it("accepts the 50-column comma-delimited BOM source as one hundred unique drafts", () => {
    expect(inputBuffer.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(
      decodedInput
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/, 1)[0]
        .split(","),
    ).toHaveLength(50);
    expect(validateImport(rows, 100)).toEqual({ errors: [], warnings: [] });
    expect(rows).toHaveLength(100);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(100);
    expect(
      rows.every(
        (row) =>
          row.module_number === "5" &&
          row.package_code === "AD_M5_100" &&
          row.review_status === "draft",
      ),
    ).toBe(true);
  });

  it("preserves chapter, style, difficulty, cognition, eligibility, and answer balance", () => {
    const count = (field, value) => rows.filter((row) => row[field] === value).length;
    expect(["1", "2", "3", "4"].map((chapter) => count("chapter_number", chapter))).toEqual([
      24, 24, 26, 26,
    ]);
    expect(count("question_style", "direct_exam_style")).toBe(50);
    expect(count("question_style", "brief_application")).toBe(50);
    expect(count("difficulty", "medium")).toBe(50);
    expect(count("difficulty", "medium_hard")).toBe(50);
    expect(count("cognitive_level", "recall")).toBe(50);
    expect(count("cognitive_level", "application")).toBe(50);
    expect(count("eligible_for_final_exam", "true")).toBe(75);
    for (const letter of ["A", "B", "C", "D"]) expect(count("correct_letter", letter)).toBe(25);
  });

  it("retains complete feedback, support, and paired sibling links", () => {
    const byId = new Map(rows.map((row) => [row.external_id, row]));
    expect(new Set(rows.map((row) => row.question_family_code)).size).toBe(50);
    for (const row of rows) {
      expect(new Set(["a", "b", "c", "d"].map((key) => row[`choice_${key}`])).size).toBe(4);
      for (const key of ["a", "b", "c", "d"]) {
        expect(row[`choice_${key}_explanation`]).not.toBe("");
      }
      expect(row.short_explanation).not.toBe("");
      expect(row.explanation).not.toBe("");
      expect(row.memory_aid).not.toBe("");
      expect(row.remediation_text).not.toBe("");
      expect(row.show_visual_button).toBe("true");
      for (const target of splitReinforcementIds(row.reinforcement_question_ids)) {
        expect(byId.get(target)?.question_family_code).toBe(row.question_family_code);
      }
    }
  });

  it("maps all questions exactly to seven valid 1586 by 992 PNG assets", () => {
    const actualCounts = Object.fromEntries(
      manifest.map((asset) => [
        asset.visual_asset_key,
        rows.filter((row) => row.visual_asset_key === asset.visual_asset_key).length,
      ]),
    );
    expect(actualCounts).toEqual({
      module5_space_basics: 16,
      module5_galaxies_universe: 8,
      module5_stars_life_cycle: 24,
      module5_sun_moon_eclipses: 20,
      module5_small_bodies: 6,
      module5_inner_outer_planets: 22,
      module5_planet_dwarf_pluto: 4,
    });
    expect(Object.values(actualCounts).reduce((sum, count) => sum + count, 0)).toBe(100);
    expect(
      validateVisualManifest(manifest, aerospaceModuleFiveDirectory, {
        expectedAssetCount: 7,
        expectedQuestionCount: null,
      }),
    ).toEqual([]);
    for (const asset of manifest) {
      expect(normalizeStoragePath(asset.visual_storage_path)).toBe(
        `assets/cap-visuals/${asset.visual_file_name}`,
      );
      expect(
        readPngDimensions(
          fs.readFileSync(path.join(aerospaceModuleFiveDirectory, asset.visual_file_name)),
        ),
      ).toEqual({ width: 1586, height: 992 });
    }
  });
});

describe("Aerospace Dimensions Module 6 validation and visual integration", () => {
  const inputBuffer = fs.readFileSync(aerospaceModuleSixInputPath);
  const decodedInput = decodeImportBuffer(inputBuffer);
  const rows = parseImport(decodedInput, aerospaceModuleSixDefaults);
  const manifest = parseVisualManifest(fs.readFileSync(aerospaceModuleSixVisualManifestPath));

  it("accepts the 50-column comma-delimited BOM source as one hundred unique drafts", () => {
    expect(inputBuffer.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(
      decodedInput
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/, 1)[0]
        .split(","),
    ).toHaveLength(50);
    expect(validateImport(rows, 100)).toEqual({ errors: [], warnings: [] });
    expect(rows).toHaveLength(100);
    expect(new Set(rows.map((row) => row.external_id)).size).toBe(100);
    expect(
      rows.every(
        (row) =>
          row.module_number === "6" &&
          row.package_code === "AD_M6_100" &&
          row.review_status === "draft",
      ),
    ).toBe(true);
  });

  it("preserves chapter, style, difficulty, cognition, eligibility, and answer balance", () => {
    const count = (field, value) => rows.filter((row) => row[field] === value).length;
    expect(["1", "2", "3"].map((chapter) => count("chapter_number", chapter))).toEqual([
      40, 34, 26,
    ]);
    expect(new Set(rows.map((row) => row.chapter_title))).toEqual(
      new Set(["Unmanned Spacecraft", "Manned Spacecraft", "Living and Working in Space"]),
    );
    expect(count("question_style", "direct_exam_style")).toBe(50);
    expect(count("question_style", "brief_application")).toBe(50);
    expect(count("difficulty", "medium")).toBe(50);
    expect(count("difficulty", "medium_hard")).toBe(50);
    expect(count("cognitive_level", "recall")).toBe(50);
    expect(count("cognitive_level", "application")).toBe(50);
    expect(count("eligible_for_final_exam", "true")).toBe(75);
    for (const letter of ["A", "B", "C", "D"]) expect(count("correct_letter", letter)).toBe(25);
  });

  it("uses the existing controlled metadata values without normalization", () => {
    expect(new Set(rows.map((row) => row.content_origin))).toEqual(
      new Set(["original_textbook_grounded"]),
    );
    expect(new Set(rows.map((row) => row.style_reference))).toEqual(
      new Set(["Mitchell_Aerospace_sample_style_analysis"]),
    );
    expect(new Set(rows.map((row) => row.visual_priority))).toEqual(new Set(["high"]));
    expect(new Set(rows.map((row) => row.visual_display_mode))).toEqual(
      new Set(["optional_after_answer"]),
    );
  });

  it("retains complete feedback, support, and paired sibling links", () => {
    const byId = new Map(rows.map((row) => [row.external_id, row]));
    expect(new Set(rows.map((row) => row.question_family_code)).size).toBe(50);
    for (const row of rows) {
      expect(new Set(["a", "b", "c", "d"].map((key) => row[`choice_${key}`])).size).toBe(4);
      for (const key of ["a", "b", "c", "d"]) {
        expect(row[`choice_${key}_explanation`]).not.toBe("");
      }
      expect(row.short_explanation).not.toBe("");
      expect(row.explanation).not.toBe("");
      expect(row.memory_aid).not.toBe("");
      expect(row.remediation_text).not.toBe("");
      expect(row.show_visual_button).toBe("true");
      for (const target of splitReinforcementIds(row.reinforcement_question_ids)) {
        expect(byId.get(target)?.question_family_code).toBe(row.question_family_code);
      }
    }
  });

  it("maps all questions exactly to seven valid 1448 by 1086 PNG assets", () => {
    const actualCounts = Object.fromEntries(
      manifest.map((asset) => [
        asset.visual_asset_key,
        rows.filter((row) => row.visual_asset_key === asset.visual_asset_key).length,
      ]),
    );
    expect(actualCounts).toEqual({
      module6_spacecraft_basics: 6,
      module6_satellite_systems_subsystems: 6,
      module6_unmanned_spacecraft_missions: 28,
      module6_manned_spaceflight_timeline: 18,
      module6_us_space_projects: 14,
      module6_space_stations: 14,
      module6_living_working_space: 14,
    });
    expect(Object.values(actualCounts).reduce((sum, count) => sum + count, 0)).toBe(100);
    expect(
      validateVisualManifest(manifest, aerospaceModuleSixDirectory, {
        expectedAssetCount: 7,
        expectedQuestionCount: null,
      }),
    ).toEqual([]);
    for (const asset of manifest) {
      expect(normalizeStoragePath(asset.visual_storage_path)).toBe(
        `assets/cap-visuals/${asset.visual_file_name}`,
      );
      expect(
        readPngDimensions(
          fs.readFileSync(path.join(aerospaceModuleSixDirectory, asset.visual_file_name)),
        ),
      ).toEqual({ width: 1448, height: 1086 });
    }
  });
});
