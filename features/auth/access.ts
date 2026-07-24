import type { Href } from "expo-router";

import type { AppRole } from "./types";

export type ProtectedArea = "admin" | "parent" | "student";

export function canAccessArea(roles: AppRole[], area: ProtectedArea): boolean {
  if (area === "parent") return roles.includes("parent") || roles.includes("coach");
  if (area === "admin") return roles.includes("admin") || roles.includes("content_reviewer");
  return roles.includes("student");
}

export function resolveSignedInRoute(roles: AppRole[]): Href {
  if (roles.includes("admin") || roles.includes("content_reviewer")) {
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
