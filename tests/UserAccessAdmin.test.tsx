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
          assigned_packages: ["LTL1_C1_100"],
        },
      ],
      packages: [
        {
          import_package: "LTL1_C1_100",
          exam_title: "Wright Brothers Leadership",
          topic_titles: ["Learn to Lead, Volume 1, Chapter 1"],
          question_count: 100,
        },
        {
          import_package: "LTL1_C2_100",
          exam_title: "Wright Brothers Leadership",
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
    expect(screen.getByText("2 registered · 1 students · 2 study packets")).toBeVisible();
    expect(screen.getByText("new-cadet@example.test")).toBeVisible();
    expect(screen.getByText("No workspace role")).toBeVisible();
    expect(screen.getByText("1 assigned: LTL1_C1_100")).toBeVisible();
  });

  it("grants Student access and saves the selected packets together", async () => {
    await render(<UserAccessAdmin />);
    await act(() => fireEvent.press(screen.getByLabelText("Manage access for New Cadet")));
    expect(screen.getByText("Study packets")).toBeVisible();
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
