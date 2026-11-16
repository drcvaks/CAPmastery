import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, useWindowDimensions } from "react-native";

import { RequireRole } from "../../features/auth/components/RequireRole";
import { WebStudentSidebar } from "../../features/shell/components/WebStudentSidebar";
import { theme } from "../../lib/constants/theme";

export default function StudentLayout() {
  const { width } = useWindowDimensions();
  const useWebSidebar = Platform.OS === "web" && width >= 900;

  return (
    <RequireRole area="student">
      <Tabs
        tabBar={useWebSidebar ? (props) => <WebStudentSidebar {...props} /> : undefined}
        screenOptions={{
          headerShown: !useWebSidebar,
          headerStyle: {
            backgroundColor: theme.colors.primaryDark,
          },
          headerTintColor: theme.colors.surface,
          headerTitleStyle: { fontWeight: "900", letterSpacing: 0.3 },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.muted,
          tabBarLabelStyle: { fontSize: 12, fontWeight: "800" },
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.borderStrong,
            borderTopWidth: 1,
            minHeight: 62,
            paddingBottom: 6,
            paddingTop: 6,
          },
          tabBarPosition: useWebSidebar ? "left" : "bottom",
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
