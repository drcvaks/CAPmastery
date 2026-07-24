import { Ionicons } from "@expo/vector-icons";
import { type Href, Link, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../../../lib/constants/theme";
import { canAccessArea, type ProtectedArea } from "../access";
import { useOptionalAuth } from "../AuthContext";

type Workspace = {
  area: ProtectedArea;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const workspaces: Workspace[] = [
  { area: "student", href: "/home", icon: "school-outline", label: "Student" },
  { area: "parent", href: "/family-progress", icon: "people-outline", label: "Family" },
  { area: "admin", href: "/admin", icon: "settings-outline", label: "Admin" },
];

export function WorkspaceSwitcher({ vertical }: { vertical: boolean }) {
  const auth = useOptionalAuth();
  const pathname = usePathname();
  const available = auth?.access
    ? workspaces.filter((workspace) => canAccessArea(auth.access?.roles ?? [], workspace.area))
    : [];

  if (auth?.status !== "signed_in" || available.length === 0) return null;

  return (
    <View
      accessibilityLabel="Available workspaces"
      style={[styles.container, vertical ? styles.containerVertical : styles.containerHorizontal]}
    >
      <Text style={styles.heading}>Workspaces</Text>
      <View style={[styles.links, vertical ? styles.linksVertical : styles.linksHorizontal]}>
        {available.map((workspace) => {
          const active = isWorkspaceActive(pathname, workspace.area);
          return (
            <Link asChild href={workspace.href} key={workspace.area}>
              <Pressable
                accessibilityRole="link"
                accessibilityState={{ selected: active }}
                style={StyleSheet.flatten([styles.link, active && styles.linkActive])}
              >
                <Ionicons
                  color={active ? theme.colors.surface : theme.colors.primary}
                  name={workspace.icon}
                  size={18}
                />
                <Text style={[styles.linkText, active && styles.linkTextActive]}>
                  {workspace.label}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

function isWorkspaceActive(pathname: string, area: ProtectedArea) {
  if (area === "admin") return pathname === "/admin" || pathname.startsWith("/admin/");
  if (area === "parent") return pathname.startsWith("/family-");
  return (
    pathname === "/home" ||
    pathname.startsWith("/study") ||
    pathname.startsWith("/progress") ||
    pathname.startsWith("/challenge")
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  containerHorizontal: {
    borderBottomWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  containerVertical: {
    borderRightWidth: 1,
    minWidth: 152,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  heading: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  link: {
    alignItems: "center",
    borderRadius: theme.radius.sm,
    flexDirection: "row",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
  },
  linkActive: { backgroundColor: theme.colors.primary },
  linkText: { color: theme.colors.primary, fontSize: 14, fontWeight: "800" },
  linkTextActive: { color: theme.colors.surface },
  links: { gap: theme.spacing.xs },
  linksHorizontal: { flexDirection: "row", flexWrap: "wrap" },
  linksVertical: { alignItems: "stretch" },
});
