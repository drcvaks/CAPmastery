import {
  MAX_QUESTION_CSV_CHARACTERS,
  MAX_QUESTION_CSV_ROWS,
  normalizePrompt,
  parseDelimitedText,
  QUESTION_CSV_HEADERS,
  QUESTION_CSV_TEMPLATE,
  validateQuestionCsv,
} from "../features/admin/csv";

function validRow(overrides: Partial<Record<(typeof QUESTION_CSV_HEADERS)[number], string>> = {}) {
  const values: Record<string, string> = Object.fromEntries(
    QUESTION_CSV_HEADERS.map((key) => [key, ""]),
  );
  Object.assign(values, {
    external_id: "CHECKPOINT8-Q001",
    objective_code: "OBJ-1",
    concept_code: "CONCEPT-1",
    question_family_code: "FAMILY-1",
    difficulty: "medium",
    cognitive_level: "understanding",
    question_type: "multiple_choice",
    question_text: "What does a reviewed question test?",
    choice_a: "One concept",
    choice_b: "A secret",
    choice_c: "Nothing",
    choice_d: "Every topic",
    correct_letter: "A",
    explanation: "A good question tests one concept.",
    choice_a_explanation: "Correct.",
    choice_b_explanation: "Secrets are not the learning objective.",
    choice_c_explanation: "The question must test something.",
    choice_d_explanation: "One item should stay focused.",
    source_reference_text: "Authorized source, page 1",
    source_pages: "1",
    source_status: "verified",
    review_status: "draft",
    estimated_time_seconds: "30",
    ...overrides,
  });
  return QUESTION_CSV_HEADERS.map((header) => csv(values[header] ?? "")).join(",");
}

function csv(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

describe("question CSV workflow", () => {
  it("publishes the complete canonical header template", () => {
    expect(QUESTION_CSV_TEMPLATE.trim().split(",")).toEqual(QUESTION_CSV_HEADERS);
  });

  it("parses quoted comma and tab-delimited content", () => {
    expect(parseDelimitedText('a,b\n"one, two",three')).toEqual([
      ["a", "b"],
      ["one, two", "three"],
    ]);
    expect(parseDelimitedText("a\tb\n1\t2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("accepts a valid draft row and preserves quoted text", () => {
    const result = validateQuestionCsv(
      `${QUESTION_CSV_TEMPLATE.trim()}\n${validRow({ question_text: "Leadership, duty, and service" })}`,
    );
    expect(result.errors).toEqual([]);
    expect(result.rows[0]?.question_text).toBe("Leadership, duty, and service");
  });

  it("rejects approval, missing values, and malformed page/time fields", () => {
    const result = validateQuestionCsv(
      `${QUESTION_CSV_TEMPLATE.trim()}\n${validRow({ review_status: "approved", choice_c: "", source_pages: "page one", estimated_time_seconds: "0" })}`,
    );
    expect(result.errors.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "choice_c is required.",
        "review_status must be draft.",
        "source_pages must be a page or range.",
        "estimated_time_seconds must be a positive integer.",
      ]),
    );
  });

  it("warns about normalized duplicate wording without silently merging rows", () => {
    const result = validateQuestionCsv(
      `${QUESTION_CSV_TEMPLATE.trim()}\n${validRow()}\n${validRow({ external_id: "CHECKPOINT8-Q002", question_text: " What does a reviewed question test?! " })}`,
    );
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(2);
    expect(result.warnings[0]?.message).toContain("resembles row 2");
    expect(normalizePrompt(" One,  TWO! ")).toBe("one two");
  });

  it("rejects duplicate, unexpected, and missing header contracts", () => {
    const duplicate = QUESTION_CSV_HEADERS.with(1, QUESTION_CSV_HEADERS[0]!).join(",");
    const duplicateResult = validateQuestionCsv(`${duplicate}\n${validRow()}`);
    expect(duplicateResult.errors.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Duplicate columns"),
        expect.stringContaining("Missing required columns"),
      ]),
    );

    const unexpected = `${QUESTION_CSV_TEMPLATE.trim()},answer_key`;
    const unexpectedResult = validateQuestionCsv(`${unexpected}\n${validRow()},secret`);
    expect(unexpectedResult.errors[0]?.message).toContain("Unexpected columns: answer_key");
    expect(unexpectedResult.rows).toEqual([]);
  });

  it("bounds oversized CSV text and row counts before import", () => {
    const oversizedText = "x".repeat(MAX_QUESTION_CSV_CHARACTERS + 1);
    expect(validateQuestionCsv(oversizedText).errors[0]?.message).toContain(
      "character safety limit",
    );

    const rows = Array.from({ length: MAX_QUESTION_CSV_ROWS + 1 }, (_, index) =>
      validRow({ external_id: `CHECKPOINT10-Q${String(index).padStart(4, "0")}` }),
    );
    const result = validateQuestionCsv(`${QUESTION_CSV_TEMPLATE.trim()}\n${rows.join("\n")}`);
    expect(result.errors[0]?.message).toContain("row safety limit");
    expect(result.rows).toEqual([]);
  });

  it("warns about every common spreadsheet-formula prefix", () => {
    for (const prefix of ["=", "+", "-", "@"]) {
      const result = validateQuestionCsv(
        `${QUESTION_CSV_TEMPLATE.trim()}\n${validRow({ memory_aid: `${prefix}formula` })}`,
      );
      expect(result.warnings.some((issue) => issue.message.includes("spreadsheet formula"))).toBe(
        true,
      );
    }
  });
});
