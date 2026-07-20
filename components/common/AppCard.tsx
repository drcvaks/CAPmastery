import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../../lib/constants/theme";

type AppCardProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function AppCard({ title, description, children }: AppCardProps) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: "800",
  },
  description: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
