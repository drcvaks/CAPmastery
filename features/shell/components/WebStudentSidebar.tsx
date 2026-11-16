import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";

import { theme } from "../../../lib/constants/theme";
import { useOptionalAuth } from "../../auth/AuthContext";
import { WorkspaceSwitcher } from "../../auth/components/WorkspaceSwitcher";

type StudentTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const routePresentation = {
  home: { label: "Home", icon: "compass", color: "#38BDF8", soft: "#0C4A6E" },
  study: { label: "Study", icon: "book", color: "#F87171", soft: "#7F1D1D" },
  progress: { label: "Progress", icon: "stats-chart", color: "#34D399", soft: "#064E3B" },
  challenge: { label: "Challenge", icon: "trophy", color: "#FBBF24", soft: "#78350F" },
} as const;

export function WebStudentSidebar({ state, descriptors, navigation }: StudentTabBarProps) {
  const auth = useOptionalAuth();
  const displayName = auth?.status === "signed_in" ? auth.access?.profile.display_name : null;

  return (
    <View accessibilityLabel="Student navigation" style={styles.sidebar}>
      <View style={styles.brandCard}>
        <View style={styles.brandMark}>
          <Ionicons color={theme.colors.goldBright} name="shield-checkmark" size={24} />
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}>CAP Mastery</Text>
          <Text style={styles.brandTagline}>Cadet study coach</Text>
        </View>
      </View>

      <View style={styles.goldRule} />

      <Text style={styles.sectionLabel}>Study tools</Text>
      <View style={styles.navigationLinks}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const presentation =
            routePresentation[route.name as keyof typeof routePresentation] ??
            routePresentation.home;
          const options = descriptors[route.key]?.options;
          const label = typeof options?.title === "string" ? options.title : presentation.label;
          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              key={route.key}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={({ pressed }) => [
                styles.navigationLink,
                focused && styles.navigationLinkActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.iconTile, { backgroundColor: presentation.soft }]}>
                <Ionicons
                  color={presentation.color}
                  name={presentation.icon as keyof typeof Ionicons.glyphMap}
                  size={19}
                />
              </View>
              <Text style={[styles.navigationText, focused && styles.navigationTextActive]}>
                {label}
              </Text>
              {focused ? (
                <View style={[styles.activeDot, { backgroundColor: theme.colors.goldBright }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.spacer} />
      <WorkspaceSwitcher hideSingle tone="dark" vertical />
      {displayName ? (
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text numberOfLines={1} style={styles.identityName}>
              {displayName}
            </Text>
            <Text style={styles.identityRole}>Student workspace</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: { borderRadius: 5, height: 9, marginLeft: "auto", width: 9 },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.goldBright,
    borderRadius: 20,
    borderWidth: 2,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarText: { color: theme.colors.surface, fontSize: 16, fontWeight: "900" },
  brandCard: {
    alignItems: "center",
    backgroundColor: "#11325B",
    borderColor: "#1F497D",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    padding: 12,
  },
  brandCopy: { flex: 1, gap: 2 },
  brandMark: {
    alignItems: "center",
    backgroundColor: "#06162B",
    borderColor: theme.colors.gold,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  brandName: {
    color: theme.colors.surface,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  brandTagline: {
    color: theme.colors.goldBright,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  goldRule: {
    backgroundColor: "#1F497D",
    height: 1,
    marginVertical: 2,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: theme.radius.sm,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  identity: {
    alignItems: "center",
    backgroundColor: "#071A33",
    borderColor: "#1B3B64",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    padding: 12,
  },
  identityCopy: { flex: 1, gap: 2 },
  identityName: { color: theme.colors.surface, fontSize: 14, fontWeight: "900" },
  identityRole: {
    color: "#9BB8D3",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  navigationLink: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    minHeight: 50,
    paddingHorizontal: 10,
  },
  navigationLinkActive: {
    backgroundColor: "#163B6B",
    borderColor: "#2C5E9E",
  },
  navigationLinks: { gap: 6 },
  navigationText: { color: "#C6D9EC", fontSize: 15, fontWeight: "700" },
  navigationTextActive: { color: theme.colors.surface, fontWeight: "900" },
  pressed: { opacity: 0.8 },
  sectionLabel: {
    color: "#89A9C6",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: theme.spacing.sm,
    paddingHorizontal: 4,
    textTransform: "uppercase",
  },
  sidebar: {
    backgroundColor: theme.colors.primary,
    borderRightColor: "#1D3F6E",
    borderRightWidth: 1,
    gap: theme.spacing.md,
    minWidth: 252,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    width: 252,
  },
  spacer: { flex: 1, minHeight: theme.spacing.lg },
});
