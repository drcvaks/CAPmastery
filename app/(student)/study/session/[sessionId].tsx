import { useLocalSearchParams } from "expo-router";

import { AppScreen } from "../../../../components/common/AppScreen";
import { StudySessionView } from "../../../../features/study/components/StudySession";

export default function StudySessionScreen() {
  const params = useLocalSearchParams<{ sessionId: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  return (
    <AppScreen
      eyebrow="Study session"
      title="Question session"
      description="Answers are graded securely. Practice-test and challenge feedback remains hidden until completion."
    >
      <StudySessionView sessionId={sessionId ?? ""} />
    </AppScreen>
  );
}
