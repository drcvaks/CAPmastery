import type { PropsWithChildren } from "react";

// Native Expo apps are already installed; the PWA experience is web-only.
export function InstallProvider({ children }: PropsWithChildren) {
  return children;
}
