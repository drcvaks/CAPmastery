import { Redirect, Stack, usePathname } from "expo-router";

import { resolveSignedInRoute } from "../../features/auth/access";
import { useAuth } from "../../features/auth/AuthProvider";
import { AuthStatusScreen } from "../../features/auth/components/AuthStatusScreen";
import { theme } from "../../lib/constants/theme";

export default function AuthLayout() {
  const auth = useAuth();
  const pathname = usePathname();

  if (auth.status === "loading") {
    return <AuthStatusScreen title="Loading CAP Mastery" description="Checking your session." />;
  }

  if (auth.status === "configuration_missing") {
    return <Redirect href="/" />;
  }

  const isActiveRecovery = auth.passwordRecovery && pathname.endsWith("/reset-password");

  if (auth.status === "signed_in" && auth.access && !isActiveRecovery) {
    return <Redirect href={resolveSignedInRoute(auth.access.roles)} />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { fontWeight: "800" },
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: "Sign in" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Reset password" }} />
      <Stack.Screen name="reset-password" options={{ title: "Choose a new password" }} />
    </Stack>
  );
}
