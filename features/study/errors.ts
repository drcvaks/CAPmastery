export function getSafeStudyMessage(error: unknown): string {
  const message = getErrorMessage(error).toLowerCase();
  if (message.includes("not enough approved questions")) {
    return "This track does not yet have 10 approved questions.";
  }
  if (message.includes("not enough available questions for the practice-test blueprint")) {
    return "This practice-test blueprint does not yet have enough available questions.";
  }
  if (message.includes("practice test time has expired")) {
    return "Time has expired. Finish the test to see your results.";
  }
  if (message.includes("network") || message.includes("fetch") || message.includes("offline")) {
    return "CAP Mastery could not reach the study service. Check your connection and try again.";
  }
  if (message.includes("already submitted with a different choice")) {
    return "This question was already answered. Refresh the session to continue.";
  }
  return "The study request could not be completed. Please try again.";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "";
}
