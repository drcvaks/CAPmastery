import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { UserAccessAdmin } from "../features/admin/components/UserAccessAdmin";
import * as hooks from "../features/admin/hooks/useAdminUserAccess";

jest.mock("../features/admin/hooks/useAdminUserAccess", () => ({
  useAdminUserAccessOverview: jest.fn(),
  useUpdateAdminStudentAccess: jest.fn(),
}));

const update = {
  data: undefined,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: false,
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
};

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
  jest.mocked(hooks.useUpdateAdminStudentAccess).mockReturnValue(update as never);
});

describe("UserAccessAdmin", () => {
  it("shows registered users with existing roles and packet assignments", async () => {
    await render(<UserAccessAdmin />);
    expect(screen.getByText("2 registered · 1 students · 7 study packets")).toBeVisible();
    expect(screen.getByText("new-cadet@example.test")).toBeVisible();
    expect(screen.getByText("No workspace role")).toBeVisible();
    expect(screen.getByText("3 assigned packets")).toBeVisible();
    expect(screen.getByText("Earhart · Chapters 9–11")).toBeVisible();
    expect(screen.queryByText(/LTL3_C9_100/)).toBeNull();
  });

  it("grants Student access and saves the selected packets together", async () => {
    await render(<UserAccessAdmin />);
    await act(() => fireEvent.press(screen.getByLabelText("Manage access for New Cadet")));
    expect(screen.getByText("Study packets")).toBeVisible();
    await act(() => fireEvent.press(screen.getByLabelText("Wright Brothers packets")));
    expect(screen.getByLabelText("Assign LTL1_C1_100")).toBeDisabled();

    await act(() =>
      fireEvent(screen.getByLabelText("Student workspace access"), "valueChange", true),
    );
    await act(() => fireEvent(screen.getByLabelText("Assign LTL1_C1_100"), "valueChange", true));
    await act(() => fireEvent.press(screen.getByText("Save student access")));

    expect(update.mutateAsync).toHaveBeenCalledWith({
      userId: "ac100000-0000-4000-8000-000000000002",
      studentEnabled: true,
      importPackages: ["LTL1_C1_100"],
    });
  });

  it("orders exam groups and expands only the requested packet menu", async () => {
    await render(<UserAccessAdmin />);
    await act(() => fireEvent.press(screen.getByLabelText("Manage access for New Cadet")));

    const groupLabels = [
      "Wright Brothers packets",
      "Billy Mitchell Leadership packets",
      "Billy Mitchell Aerospace packets",
      "Earhart packets",
    ];
    expect(
      screen
        .getAllByRole("button")
        .map((element) => element.props.accessibilityLabel)
        .filter((label) => groupLabels.includes(label)),
    ).toEqual(groupLabels);
    expect(screen.getByLabelText("Wright Brothers packets").props.accessibilityState).toEqual({
      expanded: false,
    });
    expect(
      screen.getByLabelText("Billy Mitchell Leadership packets").props.accessibilityState,
    ).toEqual({ expanded: false });
    expect(screen.queryByLabelText("Assign LTL1_C1_100")).toBeNull();
    expect(screen.queryByLabelText("Assign LTL2_C4_75")).toBeNull();

    await act(() => fireEvent.press(screen.getByLabelText("Wright Brothers packets")));
    expect(screen.getByLabelText("Assign LTL1_C1_100")).toBeVisible();
    await act(() => fireEvent.press(screen.getByLabelText("Billy Mitchell Leadership packets")));
    expect(screen.getByLabelText("Assign LTL2_C4_75")).toBeVisible();
    expect(screen.getByText("Select all Billy Mitchell Leadership")).toBeVisible();
  });

  it("filters by email and returns to the complete list", async () => {
    await render(<UserAccessAdmin />);
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
