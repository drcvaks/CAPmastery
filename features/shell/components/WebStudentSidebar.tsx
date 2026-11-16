import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";

import { theme } from "../../../lib/constants/theme";
import { useOptionalAuth } from "../../auth/AuthContext";
import { WorkspaceSwitcher } from "../../auth/components/WorkspaceSwitcher";

type StudentTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

// eslint-disable-next-line @typescript-eslint/no-require-imports
const capMasteryLogo = require("../../../assets/cap-mastery-logo.png");

const routePresentation = {
  home: { label: "Home", icon: "compass", color: "#FFFFFF", soft: "#123C7A" },
  study: { label: "Study", icon: "book", color: "#FCA5A5", soft: "#7F1D1D" },
  progress: { label: "Progress", icon: "stats-chart", color: "#6EE7B7", soft: "#064E3B" },
  challenge: { label: "Challenge", icon: "trophy", color: "#E2E8F0", soft: "#1E3A5F" },
} as const;

export function WebStudentSidebar({ state, descriptors, navigation }: StudentTabBarProps) {
  const auth = useOptionalAuth();
  const displayName = auth?.status === "signed_in" ? auth.access?.profile.display_name : null;

  return (
    <View accessibilityLabel="Student navigation" style={styles.sidebar}>
      <View style={styles.brandCard}>
        <View style={styles.brandMark}>
          <Image
            accessibilityLabel="CAP Mastery crest"
            resizeMode="contain"
            source={capMasteryLogo}
            style={styles.brandLogo}
          />
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}>CAP Mastery</Text>
          <Text style={styles.brandTagline}>Cadet study coach</Text>
        </View>
      </View>

      <View style={styles.silverRule} />

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
              {focused ? <View style={styles.activeDot} /> : null}
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
  activeDot: {
    backgroundColor: "#BA121A",
    borderColor: "#FFFFFF",
    borderRadius: 5,
    borderWidth: 1.5,
    height: 9,
    marginLeft: "auto",
    width: 9,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderColor: "#CBD5E1",
    borderRadius: 20,
    borderWidth: 1.5,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarText: { color: theme.colors.surface, fontSize: 16, fontWeight: "900" },
  brandCard: {
    alignItems: "center",
    backgroundColor: "#0A2E66",
    borderColor: "#1D4682",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    padding: 10,
  },
  brandCopy: { flex: 1, gap: 2 },
  brandLogo: {
    height: "100%",
    width: "100%",
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    height: 46,
    justifyContent: "center",
    overflow: "hidden",
    width: 46,
  },
  brandName: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  brandTagline: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  silverRule: {
    backgroundColor: "#183B70",
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
    backgroundColor: "#021636",
    borderColor: "#163564",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    padding: 12,
  },
  identityCopy: { flex: 1, gap: 2 },
  identityName: { color: theme.colors.surface, fontSize: 14, fontWeight: "900" },
  identityRole: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
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
    backgroundColor: "#0D3573",
    borderColor: "#265399",
  },
  navigationLinks: { gap: 6 },
  navigationText: { color: "#CBD5E1", fontSize: 15, fontWeight: "700" },
  navigationTextActive: { color: theme.colors.surface, fontWeight: "900" },
  pressed: { opacity: 0.8 },
  sectionLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: theme.spacing.sm,
    paddingHorizontal: 4,
    textTransform: "uppercase",
  },
  sidebar: {
    backgroundColor: theme.colors.primary,
    borderRightColor: "#163564",
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
