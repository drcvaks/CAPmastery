import { AppLinkButton } from "../../components/common/AppLinkButton";
import { PlaceholderScreen } from "../../features/shell/components/PlaceholderScreen";

export default function SignInScreen() {
  return (
    <PlaceholderScreen
      area="Authentication"
      title="Sign in"
      description="Email/password authentication and recovery will be connected to the separate CAP Mastery Supabase project."
      checkpoint="Checkpoint 2"
    >
      <AppLinkButton href="/" label="Back to shell home" variant="secondary" />
    </PlaceholderScreen>
  );
}
