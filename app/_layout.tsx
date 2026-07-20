import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RouteErrorBoundary } from "../components/common/RouteErrorBoundary";
import { AuthProvider } from "../features/auth/AuthProvider";
import { theme } from "../lib/constants/theme";
import { queryClient } from "../lib/queryClient";

export const ErrorBoundary = RouteErrorBoundary;

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: theme.colors.background },
                headerBackButtonDisplayMode: "minimal",
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: { fontWeight: "800" },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(student)" options={{ headerShown: false }} />
              <Stack.Screen name="(admin)" options={{ headerShown: false }} />
              <Stack.Screen name="unauthorized" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ title: "Not found" }} />
            </Stack>
            <StatusBar style="dark" />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
