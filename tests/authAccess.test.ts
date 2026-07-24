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

  it("routes a content reviewer to the restricted content workspace", () => {
    expect(canAccessArea(["content_reviewer"], "admin")).toBe(true);
    expect(canAccessArea(["content_reviewer"], "student")).toBe(false);
    expect(resolveSignedInRoute(["content_reviewer"])).toBe("/admin");
  });

  it("does not invent access for an unassigned account", () => {
    expect(canAccessArea([], "student")).toBe(false);
    expect(resolveSignedInRoute([])).toBe("/unauthorized");
  });

  it("routes parents and coaches to linked-student progress", () => {
    expect(canAccessArea(["parent"], "parent")).toBe(true);
    expect(canAccessArea(["coach"], "parent")).toBe(true);
    expect(canAccessArea(["content_reviewer"], "parent")).toBe(false);
    expect(resolveSignedInRoute(["parent"])).toBe("/family-progress");
  });
});
