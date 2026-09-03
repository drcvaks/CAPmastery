export type OperationalErrorArea = "auth" | "content" | "navigation" | "practice" | "study";

type OperationalErrorContext = {
  area: OperationalErrorArea;
  operation: string;
};

export function classifyOperationalError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (/network|fetch|timeout|connection/.test(message)) return "network";
  if (/auth|session|token|jwt|permission|denied|unauthorized/.test(message)) return "access";
  if (/parse|schema|invalid|validation/.test(message)) return "validation";
  return "unexpected";
}

export function reportOperationalError(error: unknown, context: OperationalErrorContext) {
  const event = {
    area: context.area,
    category: classifyOperationalError(error),
    operation: context.operation,
  };

  // Production monitoring is intentionally provider-neutral for the pilot. Do
  // not include exception text, student identifiers, answers, emails, or tokens.
  if (__DEV__) console.warn("CAP Mastery operational error", event);
}
