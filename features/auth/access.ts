import type { Href } from "expo-router";

import type { AppRole } from "./types";

export type ProtectedArea = "admin" | "parent" | "student" | "content-review";

export function canAccessArea(roles: AppRole[], area: ProtectedArea): boolean {
  if (area === "parent") return roles.includes("parent") || roles.includes("coach");
  if (area === "admin") return roles.includes("admin");
  if (area === "content-review")
    return roles.some(
      (role) => role === "admin" || role === "content_reviewer" || role === "content_tester",
    );
  return roles.includes("student");
}

export function resolveSignedInRoute(roles: AppRole[]): Href {
  if (roles.includes("admin")) {
    return "/admin";
  }
  if (canAccessArea(roles, "content-review")) return "/content-review";

  if (roles.includes("student")) {
    return "/home";
  }

  if (roles.includes("parent") || roles.includes("coach")) {
    return "/family-progress";
  }

  return "/unauthorized";
}
