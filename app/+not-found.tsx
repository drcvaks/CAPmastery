import { AppLinkButton } from "../components/common/AppLinkButton";
import { AppScreen } from "../components/common/AppScreen";

export default function NotFoundScreen() {
  return (
    <AppScreen
      eyebrow="404"
      title="Page not found"
      description="The requested CAP Mastery page does not exist."
      actions={<AppLinkButton href="/" label="Return home" />}
    />
  );
}
