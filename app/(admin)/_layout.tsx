import { Stack } from "expo-router";

import { theme } from "../../lib/constants/theme";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { fontWeight: "800" },
      }}
    >
      <Stack.Screen name="admin" options={{ title: "Administration" }} />
    </Stack>
  );
}
