import { Redirect } from "expo-router";
import { Text } from "react-native";

import { AppButton } from "../components/common/AppButton";
import { AppCard } from "../components/common/AppCard";
import { AppScreen } from "../components/common/AppScreen";
import { resolveSignedInRoute } from "../features/auth/access";
import { useAuth } from "../features/auth/AuthProvider";
import { AuthStatusScreen } from "../features/auth/components/AuthStatusScreen";
import { theme } from "../lib/constants/theme";

export default function WelcomeScreen() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return <AuthStatusScreen title="Loading CAP Mastery" description="Restoring your session." />;
  }

  if (auth.status === "signed_out") {
    return <Redirect href="/sign-in" />;
  }

  if (auth.status === "signed_in" && auth.access) {
    return <Redirect href={resolveSignedInRoute(auth.access.roles)} />;
  }

  return (
    <AppScreen
      eyebrow="Secure configuration"
      title={auth.status === "configuration_missing" ? "Connect CAP Mastery" : "Access unavailable"}
      description={auth.errorMessage ?? "CAP Mastery could not restore secure access."}
    >
      <AppCard title="Development setup">
        <Text style={{ color: theme.colors.muted, lineHeight: 22 }}>
          Add only the CAP Mastery project URL and publishable key to the ignored .env.local file,
          then restart Expo. Never add a service-role key to an EXPO_PUBLIC variable.
        </Text>
        {auth.status === "error" ? (
          <AppButton
            label="Retry session"
            onPress={() => void auth.refreshAccess()}
            variant="secondary"
          />
        ) : null}
      </AppCard>
    </AppScreen>
  );
}
