import {
  adminUserAccessOverviewSchema,
  questionStyleReferenceSchema,
} from "../features/admin/schemas";

describe("admin review schemas", () => {
  it.each([
    "pre_sample_bank_review",
    "Mitchell_sample_style_analysis",
    "Mitchell_Aerospace_sample_style_analysis",
    "Wright Brothers milestone sample exams used as style/difficulty reference only",
    "Three Wright Brothers Milestone exam forms used as style/difficulty reference only",
    "Three Earhart Milestone Leadership exam forms used as style/difficulty reference only; no milestone question copied",
    "Three Earhart Milestone Leadership exam forms used only as style/difficulty references; no milestone question copied",
  ])("accepts the governed style reference %s", (styleReference) => {
    expect(questionStyleReferenceSchema.parse(styleReference)).toBe(styleReference);
  });

  it("rejects an ungoverned style reference", () => {
    expect(() => questionStyleReferenceSchema.parse("unverified exam source")).toThrow();
  });
});

describe("admin user-access schemas", () => {
  it("accepts the protected user and packet overview", () => {
    expect(
      adminUserAccessOverviewSchema.parse({
        users: [
          {
            user_id: "ac100000-0000-4000-8000-000000000002",
            email: "new-cadet@example.test",
            display_name: "New Cadet",
            status: "active",
            created_at: "2026-10-06T12:00:00Z",
            roles: ["student"],
            assigned_packages: ["LTL1_C1_100"],
          },
        ],
        packages: [
          {
            import_package: "LTL1_C1_100",
            exam_title: "Wright Brothers Leadership",
            topic_titles: ["Chapter 1"],
            question_count: 100,
          },
        ],
      }).users[0]?.email,
    ).toBe("new-cadet@example.test");
  });

  it("rejects an ungoverned role from the server boundary", () => {
    expect(() =>
      adminUserAccessOverviewSchema.parse({
        users: [
          {
            user_id: "ac100000-0000-4000-8000-000000000002",
            email: "new-cadet@example.test",
            display_name: "New Cadet",
            status: "active",
            created_at: "2026-10-06T12:00:00Z",
            roles: ["owner"],
            assigned_packages: [],
          },
        ],
        packages: [],
      }),
    ).toThrow();
  });
});
