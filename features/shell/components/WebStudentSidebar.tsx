import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";

import { theme } from "../../../lib/constants/theme";
import { useOptionalAuth } from "../../auth/AuthContext";
import { WorkspaceSwitcher } from "../../auth/components/WorkspaceSwitcher";

type StudentTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const routePresentation = {
  home: { label: "Home", icon: "home", color: "#53B7E8", soft: "#DDF4FF" },
  study: { label: "Study", icon: "book", color: "#E96472", soft: "#FCE4E7" },
  progress: { label: "Progress", icon: "trending-up", color: "#42B983", soft: "#DDF6E9" },
  challenge: { label: "Challenge", icon: "trophy", color: "#E6A82D", soft: "#FFF1C9" },
} as const;

export function WebStudentSidebar({ state, descriptors, navigation }: StudentTabBarProps) {
  const auth = useOptionalAuth();
  const displayName = auth?.status === "signed_in" ? auth.access?.profile.display_name : null;

  return (
    <View accessibilityLabel="Student navigation" style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Ionicons color={theme.colors.primary} name="school" size={22} />
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}>CAP Mastery</Text>
          <Text style={styles.brandTagline}>Cadet study coach</Text>
        </View>
      </View>

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
                  size={20}
                />
              </View>
              <Text style={[styles.navigationText, focused && styles.navigationTextActive]}>
                {label}
              </Text>
              {focused ? (
                <View style={[styles.activeDot, { backgroundColor: presentation.color }]} />
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
  activeDot: { borderRadius: 4, height: 8, marginLeft: "auto", width: 8 },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  avatarText: { color: theme.colors.surface, fontSize: 16, fontWeight: "900" },
  brand: { alignItems: "center", flexDirection: "row", gap: theme.spacing.sm },
  brandCopy: { flex: 1 },
  brandMark: {
    alignItems: "center",
    backgroundColor: "#CFF5F2",
    borderRadius: theme.radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  brandName: { color: theme.colors.surface, fontSize: 20, fontWeight: "900" },
  brandTagline: { color: "#B9CFDF", fontSize: 11, fontWeight: "700" },
  iconTile: {
    alignItems: "center",
    borderRadius: theme.radius.sm,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  identity: {
    alignItems: "center",
    borderTopColor: "#365169",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  identityCopy: { flex: 1 },
  identityName: { color: theme.colors.surface, fontSize: 14, fontWeight: "900" },
  identityRole: { color: "#B9CFDF", fontSize: 11 },
  navigationLink: {
    alignItems: "center",
    borderRadius: theme.radius.md,
    flexDirection: "row",
    gap: theme.spacing.sm,
    minHeight: 50,
    paddingHorizontal: theme.spacing.sm,
  },
  navigationLinkActive: { backgroundColor: "#FFFFFF1F" },
  navigationLinks: { gap: theme.spacing.xs },
  navigationText: { color: "#D8E6F0", fontSize: 15, fontWeight: "700" },
  navigationTextActive: { color: theme.colors.surface, fontWeight: "900" },
  pressed: { opacity: 0.78 },
  sectionLabel: {
    color: "#8FB1C8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: theme.spacing.lg,
    textTransform: "uppercase",
  },
  sidebar: {
    backgroundColor: theme.colors.primary,
    borderRightColor: "#29465F",
    borderRightWidth: 1,
    gap: theme.spacing.md,
    minWidth: 238,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    width: 238,
  },
  spacer: { flex: 1, minHeight: theme.spacing.lg },
});
