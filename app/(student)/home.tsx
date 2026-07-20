import { AppLinkButton } from "../../components/common/AppLinkButton";
import { PlaceholderScreen } from "../../features/shell/components/PlaceholderScreen";

export default function StudentHomeScreen() {
  return (
    <PlaceholderScreen
      area="Student"
      title="Student home"
      description="The future dashboard will show exam focus, recommended review, readiness, streaks, and supportive next steps."
      checkpoint="Checkpoint 6"
    >
      <AppLinkButton href="/" label="Return to shell home" variant="secondary" />
    </PlaceholderScreen>
  );
}
