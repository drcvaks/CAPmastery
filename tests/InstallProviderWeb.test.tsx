import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { InstallProvider } from "../features/install/InstallProvider.web";
import { InstallButton } from "../features/install/InstallButton";
import { useOptionalAuth } from "../features/auth/AuthContext";

jest.mock("../features/auth/AuthContext", () => ({ useOptionalAuth: jest.fn() }));
jest.mock("expo-router", () => ({ usePathname: () => "/home" }));

it("offers installation once, consumes the browser prompt once and hides controls after installation", async () => {
  const properties = [
    "matchMedia",
    "localStorage",
    "addEventListener",
    "removeEventListener",
  ] as const;
  const originals = properties.map((key) => Object.getOwnPropertyDescriptor(window, key));
  const listeners = new Map<string, (event: Event) => void>();
  const saved = new Map<string, string>();
  Object.defineProperties(window, {
    matchMedia: {
      configurable: true,
      value: () => ({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }),
    },
    localStorage: {
      configurable: true,
      value: {
        getItem: (key: string) => saved.get(key) ?? null,
        setItem: (key: string, value: string) => saved.set(key, value),
      },
    },
    addEventListener: {
      configurable: true,
      value: (name: string, listener: (event: Event) => void) => listeners.set(name, listener),
    },
    removeEventListener: { configurable: true, value: (name: string) => listeners.delete(name) },
  });
  jest.mocked(useOptionalAuth).mockReturnValue({
    status: "signed_in",
    session: { user: { id: "install-cadet" } },
    access: { profile: { status: "active" } },
    passwordRecovery: false,
  } as never);
  try {
    const component = (
      <InstallProvider>
        <InstallButton />
      </InstallProvider>
    );
    const first = await render(component);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });
    expect(screen.getByRole("header", { name: "Install CAP Mastery" })).toBeVisible();
    await fireEvent.press(screen.getByLabelText("Maybe later"));
    await first.unmount();
    const second = await render(component);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });
    expect(screen.queryByRole("header", { name: "Install CAP Mastery" })).toBeNull();
    const prompt = jest.fn().mockResolvedValue(undefined);
    await act(async () => {
      listeners.get("beforeinstallprompt")?.({
        preventDefault: jest.fn(),
        prompt,
        userChoice: Promise.resolve({ outcome: "accepted" }),
      } as unknown as Event);
    });
    await fireEvent.press(screen.getByLabelText("Install CAP Mastery"));
    await fireEvent.press(screen.getByLabelText("Install now"));
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("Install now")).toBeNull();
    await act(async () => {
      listeners.get("appinstalled")?.({} as Event);
    });
    expect(screen.queryByLabelText("Install CAP Mastery")).toBeNull();
    await second.unmount();
  } finally {
    properties.forEach((key, index) => {
      const descriptor = originals[index];
      if (descriptor) Object.defineProperty(window, key, descriptor);
      else Reflect.deleteProperty(window, key);
    });
  }
});
