import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppCard } from "../../../components/common/AppCard";
import { AppScreen } from "../../../components/common/AppScreen";
import { theme } from "../../../lib/constants/theme";

type PlaceholderScreenProps = {
  area: string;
  title: string;
  description: string;
  checkpoint: string;
  children?: ReactNode;
};

export function PlaceholderScreen({
  area,
  title,
  description,
  checkpoint,
  children,
}: PlaceholderScreenProps) {
  return (
    <AppScreen eyebrow={area} title={title} description={description}>
      <AppCard
        title="Shell status"
        description="Navigation is active; product behavior is intentionally deferred."
      >
        <View style={styles.statusRow}>
          <View accessibilityLabel="Ready" style={styles.statusDot} />
          <Text style={styles.statusText}>Planned for {checkpoint}</Text>
        </View>
        {children}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  statusDot: {
    backgroundColor: theme.colors.success,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  statusText: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
});
