import { fireEvent, render, screen } from "@testing-library/react-native";

import { WebStudentSidebar } from "../features/shell/components/WebStudentSidebar";
import { useOptionalAuth } from "../features/auth/AuthContext";

jest.mock("../features/auth/AuthContext", () => ({
  useOptionalAuth: jest.fn(),
}));
jest.mock("../features/auth/components/WorkspaceSwitcher", () => ({
  WorkspaceSwitcher: () => null,
}));

const routes = ["home", "study", "progress", "challenge"].map((name) => ({
  key: `${name}-key`,
  name,
  params: undefined,
}));

describe("wide-web student sidebar", () => {
  it("renders colorful study destinations and uses tab navigation without resetting stacks", async () => {
    jest.mocked(useOptionalAuth).mockReturnValue({
      status: "signed_in",
      access: { profile: { display_name: "Heshy Vaks" } },
    } as never);
    const emit = jest.fn().mockReturnValue({ defaultPrevented: false });
    const navigate = jest.fn();

    await render(
      <WebStudentSidebar
        descriptors={
          Object.fromEntries(
            routes.map((route) => [route.key, { options: { title: titleCase(route.name) } }]),
          ) as never
        }
        insets={{ bottom: 0, left: 0, right: 0, top: 0 }}
        navigation={{ emit, navigate } as never}
        state={{ index: 0, routes } as never}
      />,
    );

    expect(screen.getByText("CAP Mastery")).toBeVisible();
    expect(screen.getByText("Cadet study coach")).toBeVisible();
    expect(screen.getByText("Heshy Vaks")).toBeVisible();
    expect(screen.getByRole("tab", { name: "Home" }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByRole("tab", { name: "Study" }).props.accessibilityState).toEqual({
      selected: false,
    });

    fireEvent.press(screen.getByRole("tab", { name: "Study" }));
    expect(emit).toHaveBeenCalledWith({
      type: "tabPress",
      target: "study-key",
      canPreventDefault: true,
    });
    expect(navigate).toHaveBeenCalledWith("study", undefined);
  });
});

function titleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
