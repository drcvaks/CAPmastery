import { signInSchema, updatePasswordSchema } from "../features/auth/schemas";

describe("authentication validation", () => {
  it("requires a valid email for sign in", () => {
    expect(signInSchema.safeParse({ email: "not-email", password: "value" }).success).toBe(false);
  });

  it("requires a 10-character letter-and-number password", () => {
    expect(
      updatePasswordSchema.safeParse({ confirmPassword: "onlyletters", password: "onlyletters" })
        .success,
    ).toBe(false);
    expect(
      updatePasswordSchema.safeParse({
        confirmPassword: "securepass1",
        password: "securepass1",
      }).success,
    ).toBe(true);
  });

  it("requires matching reset passwords", () => {
    expect(
      updatePasswordSchema.safeParse({
        confirmPassword: "different2",
        password: "securepass1",
      }).success,
    ).toBe(false);
  });
});
