import type { Href } from "expo-router";

import type { AppRole } from "./types";

export type ProtectedArea = "admin" | "student";

export function canAccessArea(roles: AppRole[], area: ProtectedArea): boolean {
  return roles.includes(area === "admin" ? "admin" : "student");
}

export function resolveSignedInRoute(roles: AppRole[]): Href {
  if (roles.includes("admin")) {
    return "/admin";
  }

  if (roles.includes("student")) {
    return "/home";
  }

  return "/unauthorized";
}
