import { render, screen } from "@testing-library/react-native";

import { WorkspaceSwitcher } from "../features/auth/components/WorkspaceSwitcher";
import { useOptionalAuth } from "../features/auth/AuthContext";

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  usePathname: () => "/admin",
}));
jest.mock("../features/auth/AuthContext", () => ({
  useOptionalAuth: jest.fn(),
}));

const access = {
  profile: {
    id: "10000000-0000-4000-8000-000000000001",
    display_name: "Multi-role user",
    first_name: "Chaim",
    status: "active",
  },
  roles: ["admin", "parent"],
};

describe("workspace switcher", () => {
  it("shows only workspaces authorized by the account roles", async () => {
    jest.mocked(useOptionalAuth).mockReturnValue({
      access,
      status: "signed_in",
    } as never);

    await render(<WorkspaceSwitcher vertical />);

    expect(screen.getByText("Admin")).toBeVisible();
    expect(screen.getByText("Family")).toBeVisible();
    expect(screen.queryByText("Student")).toBeNull();
  });

  it("does not offer family access to an admin-only account", async () => {
    jest.mocked(useOptionalAuth).mockReturnValue({
      access: { ...access, roles: ["admin"] },
      status: "signed_in",
    } as never);

    await render(<WorkspaceSwitcher vertical />);

    expect(screen.getByText("Admin")).toBeVisible();
    expect(screen.queryByText("Family")).toBeNull();
    expect(screen.queryByText("Student")).toBeNull();
  });
});
