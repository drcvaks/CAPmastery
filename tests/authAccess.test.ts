import { canAccessArea, resolveSignedInRoute } from "../features/auth/access";

describe("role-aware routing", () => {
  it("keeps a student out of the admin area", () => {
    expect(canAccessArea(["student"], "admin")).toBe(false);
    expect(resolveSignedInRoute(["student"])).toBe("/home");
  });

  it("routes an administrator to the admin workspace", () => {
    expect(canAccessArea(["admin"], "admin")).toBe(true);
    expect(resolveSignedInRoute(["admin"])).toBe("/admin");
  });

  it("does not invent access for an unassigned account", () => {
    expect(canAccessArea([], "student")).toBe(false);
    expect(resolveSignedInRoute([])).toBe("/unauthorized");
  });
});
