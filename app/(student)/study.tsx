import { AppScreen } from "../../components/common/AppScreen";
import { ContentBrowser } from "../../features/content/components/ContentBrowser";

export default function StudyScreen() {
  return (
    <AppScreen
      eyebrow="Student"
      title="Study catalog"
      description="Browse authorized Leadership and Aerospace content. Correct answers remain protected until a future server-graded submission flow."
    >
      <ContentBrowser />
    </AppScreen>
  );
}
