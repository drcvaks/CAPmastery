import type { Href } from "expo-router";

import type { AppRole } from "./types";

export type ProtectedArea = "admin" | "parent" | "student";

export function canAccessArea(roles: AppRole[], area: ProtectedArea): boolean {
  if (area === "parent") return roles.includes("parent") || roles.includes("coach");
  return roles.includes(area === "admin" ? "admin" : "student");
}

export function resolveSignedInRoute(roles: AppRole[]): Href {
  if (roles.includes("admin")) {
    return "/admin";
  }

  if (roles.includes("student")) {
    return "/home";
  }

  if (roles.includes("parent") || roles.includes("coach")) {
    return "/family-progress";
  }

  return "/unauthorized";
}
