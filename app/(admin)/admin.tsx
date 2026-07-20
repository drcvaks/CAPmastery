import { AppLinkButton } from "../../components/common/AppLinkButton";
import { SignOutButton } from "../../features/auth/components/SignOutButton";
import { PlaceholderScreen } from "../../features/shell/components/PlaceholderScreen";

export default function AdminScreen() {
  return (
    <PlaceholderScreen
      area="Administration"
      title="Admin workspace"
      description="Responsive content review, CSV import, user access, family links, and audit tools will be added in their scheduled checkpoints."
      checkpoint="Checkpoints 2–10"
    >
      <AppLinkButton href="/" label="Return to shell home" variant="secondary" />
      <SignOutButton />
    </PlaceholderScreen>
  );
}
