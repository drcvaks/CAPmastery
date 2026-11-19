/// <reference types="node" />
import { fireEvent, render, screen } from "@testing-library/react-native";
import { InstallContext } from "../features/install/InstallContext";
import { InstallButton } from "../features/install/InstallButton";
import { installInstructions } from "../features/install/installSupport";
import { readFileSync } from "fs";
import { join } from "path";
import { runInNewContext } from "vm";

it("uses manual Home Screen steps on iPhone and desktop-mode iPad", () => {
  expect(installInstructions("iPhone").steps.join(" ")).toMatch(
    /Safari.*Share.*Add to Home Screen/,
  );
  expect(installInstructions("Macintosh", 5).title).toBe("Install on iPhone or iPad");
  expect(installInstructions("Android").title).toBe("Install on Android");
  expect(installInstructions("Windows").steps.join(" ")).toContain("Chrome or Edge");
});

it("opens installation from the branded menu button", async () => {
  const open = jest.fn();
  const closeMenu = jest.fn();
  await render(
    <InstallContext.Provider value={{ open, installed: false }}>
      <InstallButton onOpen={closeMenu} />
    </InstallContext.Provider>,
  );
  await fireEvent.press(screen.getByLabelText("Install CAP Mastery"));
  expect(closeMenu).toHaveBeenCalledTimes(1);
  expect(open).toHaveBeenCalledTimes(1);
});

it("hides installation from native and already-installed app menus", async () => {
  const view = await render(<InstallButton />);
  expect(screen.queryByLabelText("Install CAP Mastery")).toBeNull();
  await view.rerender(
    <InstallContext.Provider value={{ open: jest.fn(), installed: true }}>
      <InstallButton />
    </InstallContext.Provider>,
  );
  expect(screen.queryByLabelText("Install CAP Mastery")).toBeNull();
});

it("ships a standalone manifest with correctly sized PNGs and filesystem-first routing", () => {
  const manifest = JSON.parse(
    readFileSync(join(process.cwd(), "public/manifest.webmanifest"), "utf8"),
  );
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  for (const size of [180, 192, 512]) {
    const png = readFileSync(join(process.cwd(), `public/icons/cap-mastery-${size}.png`));
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
  }
  const config = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8"));
  expect(config.routes.at(-2)).toEqual({ handle: "filesystem" });
  const html = readFileSync(join(process.cwd(), "public/index.html"), "utf8");
  expect(html).toContain('href="/manifest.webmanifest"');
  expect(html).toContain('rel="apple-touch-icon"');
});

it("leaves cross-origin traffic alone and provides only an offline navigation notice", async () => {
  const listeners: Record<
    string,
    (event: { request: { mode: string; url: string }; respondWith: jest.Mock }) => void
  > = {};
  const fetchRequest = jest.fn().mockRejectedValue(new Error("offline"));
  const response = jest.fn().mockImplementation((body: string) => ({ body }));
  runInNewContext(readFileSync(join(process.cwd(), "public/service-worker.js"), "utf8"), {
    self: {
      location: { origin: "https://cap.example.test" },
      addEventListener: (name: string, listener: (typeof listeners)[string]) => {
        listeners[name] = listener;
      },
    },
    URL,
    fetch: fetchRequest,
    Response: response,
  });
  const respondWith = jest.fn();
  listeners.fetch!({
    request: { mode: "cors", url: "https://backend.example.test/auth" },
    respondWith,
  });
  expect(respondWith).not.toHaveBeenCalled();
  expect(fetchRequest).not.toHaveBeenCalled();
  listeners.fetch!({
    request: { mode: "navigate", url: "https://cap.example.test/study" },
    respondWith,
  });
  await expect(respondWith.mock.calls[0]![0]).resolves.toEqual({
    body: expect.stringContaining("CAP Mastery needs an internet connection"),
  });
});
