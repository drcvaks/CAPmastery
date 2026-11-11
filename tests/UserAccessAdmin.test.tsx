import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { UserAccessAdmin } from "../features/admin/components/UserAccessAdmin";
import * as hooks from "../features/admin/hooks/useAdminUserAccess";
import { learningAccess } from "../services/contentTesterService";
jest.mock("../services/contentTesterService", () => ({ learningAccess: jest.fn() }));

jest.mock("../features/admin/hooks/useAdminUserAccess", () => ({
  adminUserAccessKeys: { overview: ["admin-user-access", "overview"] },
  useAdminUserAccessOverview: jest.fn(),
  useUpdateAdminStudentAccess: jest.fn(),
}));

function renderAdmin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <UserAccessAdmin />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(hooks.useAdminUserAccessOverview).mockReturnValue({
    data: {
      users: [
        {
          user_id: "ac100000-0000-4000-8000-000000000002",
          email: "new-cadet@example.test",
          display_name: "New Cadet",
          status: "active",
          created_at: "2026-10-06T12:00:00Z",
          roles: [],
          assigned_packages: [],
        },
        {
          user_id: "ac100000-0000-4000-8000-000000000003",
          email: "current-student@example.test",
          display_name: "Current Student",
          status: "active",
          created_at: "2026-10-05T12:00:00Z",
          roles: ["student"],
          assigned_packages: ["LTL3_C9_100", "LTL3_C10_100", "LTL3_C11_100"],
        },
      ],
      packages: [
        {
          import_package: "LTL3_C9_100",
          exam_title: "Earhart Leadership",
          topic_titles: ["Learn to Lead, Volume 3, Chapter 9"],
          question_count: 100,
        },
        {
          import_package: "LTL3_C10_100",
          exam_title: "Earhart Leadership",
          topic_titles: ["Learn to Lead, Volume 3, Chapter 10"],
          question_count: 100,
        },
        {
          import_package: "LTL3_C11_100",
          exam_title: "Earhart Leadership",
          topic_titles: ["Learn to Lead, Volume 3, Chapter 11"],
          question_count: 100,
        },
        {
          import_package: "AD_M1_100",
          exam_title: "Billy Mitchell Aerospace",
          topic_titles: ["Aerospace Dimensions, Module 1"],
          question_count: 100,
        },
        {
          import_package: "LTL1_C1_100",
          exam_title: "Wright Brothers",
          topic_titles: ["Learn to Lead, Volume 1, Chapter 1"],
          question_count: 100,
        },
        {
          import_package: "LTL2_C4_75",
          exam_title: "Billy Mitchell Leadership",
          topic_titles: ["Learn to Lead, Volume 2, Chapter 4"],
          question_count: 75,
        },
        {
          import_package: "LTL1_C2_100",
          exam_title: "Wright Brothers",
          topic_titles: ["Learn to Lead, Volume 1, Chapter 2"],
          question_count: 100,
        },
      ],
    },
    isPending: false,
    isError: false,
  } as never);
  jest.mocked(learningAccess).mockResolvedValue({
    grants: [],
    sections: jest
      .mocked(hooks.useAdminUserAccessOverview)
      .getMockImplementation()!().data!.packages.map((packet) => ({
      exam_id: packet.exam_title,
      exam_title: packet.exam_title,
      chapter_id: packet.import_package.startsWith("AD_") ? null : packet.import_package,
      title: packet.topic_titles[0]!,
      module_number: packet.import_package.startsWith("AD_") ? 1 : null,
      chapter_number: null,
      packages: [packet.import_package],
      question_count: packet.question_count,
      image_count: 4,
    })),
  });
});

describe("UserAccessAdmin", () => {
  it("shows registered users with existing roles and packet assignments", async () => {
    await renderAdmin();
    expect(screen.getByText("2 registered · 1 students · 7 study packets")).toBeVisible();
    expect(screen.getByText("new-cadet@example.test")).toBeVisible();
    expect(screen.getByText("No workspace role")).toBeVisible();
    expect(screen.getByText("3 assigned packets")).toBeVisible();
    expect(screen.getByText("Earhart · Chapters 9–11")).toBeVisible();
    expect(screen.queryByText(/LTL3_C9_100/)).toBeNull();
  });

  it("grants Student access and saves the selected packets together", async () => {
    await renderAdmin();
    await act(() => fireEvent.press(screen.getByLabelText("Manage access for New Cadet")));
    expect(await screen.findByText("Study & Content Review access")).toBeVisible();
    await fireEvent.press(screen.getByLabelText("Wright Brothers"));
    const chapter = "Learn to Lead, Volume 1, Chapter 1";
    await fireEvent.press(screen.getByLabelText(chapter));
    expect(screen.getAllByText("100 questions · 4 images")[0]).toBeVisible();
    const packet = `${chapter}: Study packet (LTL1_C1_100)`;
    expect(screen.getByLabelText(packet)).toBeDisabled();

    await act(() =>
      fireEvent(screen.getByLabelText("Student workspace access"), "valueChange", true),
    );
    await fireEvent(screen.getByLabelText(packet), "valueChange", true);
    await fireEvent.press(screen.getByText("Save access"));
    await screen.findByText("Access saved.");

    expect(learningAccess).toHaveBeenCalledWith("ac100000-0000-4000-8000-000000000002", {
      studentEnabled: true,
      packages: ["LTL1_C1_100"],
      grants: undefined,
    });
  });

  it("orders exam groups and expands only the requested packet menu", async () => {
    await renderAdmin();
    await act(() => fireEvent.press(screen.getByLabelText("Manage access for New Cadet")));

    await screen.findByLabelText("Wright Brothers");
    const groupLabels = [
      "Wright Brothers",
      "Billy Mitchell Leadership",
      "Billy Mitchell Aerospace",
      "Earhart",
    ];
    expect(
      screen
        .getAllByRole("button")
        .map((element) => element.props.accessibilityLabel)
        .filter((label) => groupLabels.includes(label)),
    ).toEqual(groupLabels);
    expect(screen.getByLabelText("Wright Brothers").props.accessibilityState).toEqual({
      expanded: false,
    });
    expect(screen.getByLabelText("Billy Mitchell Leadership").props.accessibilityState).toEqual({
      expanded: false,
    });
    expect(screen.queryByLabelText("Module 1")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Billy Mitchell Aerospace"));
    expect(screen.getByLabelText("Module 1")).toBeVisible();
    expect(screen.queryByLabelText("Module 1: Study packet (AD_M1_100)")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Module 1"));
    expect(screen.getByLabelText("Module 1: Study packet (AD_M1_100)")).toBeVisible();
  });

  it("filters by email and returns to the complete list", async () => {
    await renderAdmin();
    await act(() =>
      fireEvent.changeText(screen.getByLabelText("Search by name, email, or role"), "current"),
    );
    expect(screen.queryByText("New Cadet")).toBeNull();
    expect(screen.getByText("Current Student")).toBeVisible();
    await act(() => fireEvent.press(screen.getByLabelText("Manage access for Current Student")));
    await act(() => fireEvent.press(screen.getByText("Back to all users")));
    expect(screen.getByText("Current Student")).toBeVisible();
  });
});
