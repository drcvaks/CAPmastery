import { AppCard } from "../components/common/AppCard";
import { AppScreen } from "../components/common/AppScreen";
import { SignOutButton } from "../features/auth/components/SignOutButton";

export default function UnauthorizedScreen() {
  return (
    <AppScreen
      eyebrow="Secure access"
      title="No workspace assigned"
      description="Your account is signed in, but it does not currently have access to a CAP Mastery workspace."
    >
      <AppCard title="Ask an administrator">
        <SignOutButton />
      </AppCard>
    </AppScreen>
  );
}
