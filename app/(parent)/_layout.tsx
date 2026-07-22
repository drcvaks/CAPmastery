import { Stack } from "expo-router";

import { RequireRole } from "../../features/auth/components/RequireRole";
import { theme } from "../../lib/constants/theme";

export default function ParentLayout() {
  return (
    <RequireRole area="parent">
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: { fontWeight: "800" },
        }}
      >
        <Stack.Screen name="family-progress" options={{ headerShown: false }} />
      </Stack>
    </RequireRole>
  );
}
