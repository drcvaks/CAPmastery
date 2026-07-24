import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { RequireRole } from "../../features/auth/components/RequireRole";
import { theme } from "../../lib/constants/theme";

export default function StudentLayout() {
  return (
    <RequireRole area="student">
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: { fontWeight: "800" },
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.muted,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home" size={size} />,
          }}
        />
        <Tabs.Screen
          name="study"
          options={{
            title: "Study",
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="book" size={size} />,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ color, size }) => (
              <Ionicons color={color} name="trending-up" size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="challenge"
          options={{
            title: "Challenge",
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="trophy" size={size} />,
          }}
        />
      </Tabs>
    </RequireRole>
  );
}
