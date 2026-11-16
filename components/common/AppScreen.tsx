import type { PropsWithChildren, ReactNode, Ref } from "react";
import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePathname } from "expo-router";

import { useOptionalAuth } from "../../features/auth/AuthContext";
import { WorkspaceSwitcher } from "../../features/auth/components/WorkspaceSwitcher";
import { theme } from "../../lib/constants/theme";

type AppScreenProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  maxContentWidth?: number;
  scrollRef?: Ref<ScrollView>;
}>;

export function AppScreen({
  eyebrow,
  title,
  description,
  actions,
  children,
  maxContentWidth = 1140,
  scrollRef,
}: AppScreenProps) {
  const auth = useOptionalAuth();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const hasStudentWebSidebar =
    Platform.OS === "web" &&
    width >= 900 &&
    (pathname === "/home" ||
      pathname.startsWith("/study") ||
      pathname.startsWith("/progress") ||
      pathname.startsWith("/challenge"));
  const profile = auth?.status === "signed_in" ? auth.access?.profile : null;
  const firstName =
    profile?.first_name?.trim() || profile?.display_name?.trim().split(/\s+/)[0] || null;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={[styles.shell, wide && styles.shellWide]}>
        {!hasStudentWebSidebar ? <WorkspaceSwitcher vertical={wide} /> : null}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollOuter}
          keyboardShouldPersistTaps="handled"
          style={styles.scroller}
        >
          <View style={styles.topHeaderBar}>
            <View style={[styles.topHeaderInner, wide && styles.topHeaderInnerWide, { maxWidth: maxContentWidth }]}>
              <View style={[styles.titleRow, wide && styles.titleRowWide]}>
                <View style={styles.titleCopy}>
                  {eyebrow ? (
                    <View style={styles.eyebrowRow}>
                      <View style={styles.eyebrowAccent} />
                      <Text style={styles.eyebrow}>{eyebrow}</Text>
                    </View>
                  ) : null}
                  <Text accessibilityRole="header" style={[styles.title, wide && styles.titleWide]}>
                    {title}
                  </Text>
                  {description ? <Text style={styles.description}>{description}</Text> : null}
                </View>

                <View style={styles.headerRight}>
                  {firstName ? (
                    <View style={styles.identityBadge}>
                      <View style={styles.identityDot} />
                      <Text style={styles.identity}>Hello, {firstName}</Text>
                    </View>
                  ) : null}
                  {actions ? <View style={styles.actions}>{actions}</View> : null}
                </View>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.scrollContent,
              wide && styles.scrollContentWide,
              { maxWidth: maxContentWidth },
            ]}
          >
            {children}
          </View>
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
  shell: { flex: 1 },
  shellWide: { flexDirection: "row" },
  scroller: { flex: 1 },
  scrollOuter: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  topHeaderBar: {
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    width: "100%",
  },
  topHeaderInner: {
    alignSelf: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    width: "100%",
  },
  topHeaderInnerWide: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 20,
  },
  titleRow: {
    gap: theme.spacing.md,
  },
  titleRowWide: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleCopy: {
    flex: 1,
    gap: 4,
    minWidth: 240,
  },
  eyebrowRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 2,
  },
  eyebrowAccent: {
    backgroundColor: theme.colors.gold,
    borderRadius: 2,
    height: 10,
    width: 3,
  },
  eyebrow: {
    color: theme.colors.primaryLight,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  titleWide: {
    fontSize: 26,
    lineHeight: 32,
  },
  description: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 720,
  },
  headerRight: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  identityBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  identityDot: {
    backgroundColor: theme.colors.success,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  identity: {
    color: theme.colors.inkSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  scrollContent: {
    alignSelf: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    width: "100%",
  },
  scrollContentWide: {
    gap: 20,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 24,
  },
});
