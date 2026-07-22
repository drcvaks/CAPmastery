import { useLocalSearchParams } from "expo-router";

import { AppScreen } from "../../../../components/common/AppScreen";
import { StudySessionView } from "../../../../features/study/components/StudySession";

export default function StudySessionScreen() {
  const params = useLocalSearchParams<{ sessionId: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  return (
    <AppScreen
      eyebrow="Study session"
      title="Focused review"
      description="Submit one answer at a time. Correctness and feedback are computed securely after submission."
    >
      <StudySessionView sessionId={sessionId ?? ""} />
    </AppScreen>
  );
}
