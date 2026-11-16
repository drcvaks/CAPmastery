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
      <View style={styles.headerBlock}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
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
    gap: theme.spacing.md,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  headerBlock: {
    gap: 4,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
    lineHeight: 23,
  },
  description: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
