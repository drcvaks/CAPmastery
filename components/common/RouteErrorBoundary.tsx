import type { ErrorBoundaryProps } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../../lib/constants/theme";

export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.title}>
          Something went wrong
        </Text>
        <Text style={styles.message}>{error.message || "The page could not be displayed."}</Text>
        <Pressable accessibilityRole="button" onPress={retry} style={styles.button}>
          <Text style={styles.buttonLabel}>Try again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    maxWidth: 520,
    padding: theme.spacing.xl,
    width: "100%",
  },
  title: {
    color: theme.colors.danger,
    fontSize: 26,
    fontWeight: "900",
  },
  message: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 13,
  },
  buttonLabel: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
});
