import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WorkspaceSwitcher } from "../../features/auth/components/WorkspaceSwitcher";
import { theme } from "../../lib/constants/theme";

type AppScreenProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}>;

export function AppScreen({ eyebrow, title, description, actions, children }: AppScreenProps) {
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={[styles.shell, wide && styles.shellWide]}>
        <WorkspaceSwitcher vertical={wide} />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, wide && styles.scrollContentWide]}
          keyboardShouldPersistTaps="handled"
          style={styles.scroller}
        >
          <View style={styles.header}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text accessibilityRole="header" style={[styles.title, wide && styles.titleWide]}>
              {title}
            </Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
            {actions ? <View style={styles.actions}>{actions}</View> : null}
          </View>
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  scroller: { flex: 1 },
  scrollContent: {
    alignSelf: "center",
    gap: theme.spacing.lg,
    maxWidth: 1040,
    padding: theme.spacing.lg,
    width: "100%",
  },
  scrollContentWide: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.sm,
  },
  shell: { flex: 1 },
  shellWide: { flexDirection: "row" },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 39,
  },
  titleWide: {
    fontSize: 44,
    lineHeight: 50,
  },
  description: {
    color: theme.colors.muted,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 720,
  },
  actions: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
});
