import { classifyOperationalError } from "../lib/monitoring";

describe("privacy-safe operational error classification", () => {
  it.each([
    [new Error("Failed to fetch"), "network"],
    [new Error("JWT permission denied"), "access"],
    [new Error("Schema validation failed"), "validation"],
    [new Error("database detail that must not reach the UI"), "unexpected"],
  ])("classifies %s without returning raw exception text", (error, expected) => {
    const result = classifyOperationalError(error);
    expect(result).toBe(expected);
    expect(result).not.toContain(error.message);
  });
});
