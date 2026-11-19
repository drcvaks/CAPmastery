import { Ionicons } from "@expo/vector-icons";
import { type Href, Link, usePathname } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../../../lib/constants/theme";
import { canAccessArea, type ProtectedArea } from "../access";
import { useOptionalAuth } from "../AuthContext";
import { InstallButton } from "../../install/InstallButton";

const capMasteryBanner = require("../../../assets/cap-mastery-banner.png");

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
  {
    area: "content-review",
    href: "/content-review",
    icon: "create-outline",
    label: "Content Review",
  },
];

export function WorkspaceSwitcher({
  hideSingle = false,
  tone = "light",
  vertical,
}: {
  hideSingle?: boolean;
  tone?: "dark" | "light";
  vertical: boolean;
}) {
  const auth = useOptionalAuth();
  const pathname = usePathname();
  const available = auth?.access
    ? workspaces.filter((workspace) => canAccessArea(auth.access?.roles ?? [], workspace.area))
    : [];

  if (
    auth?.status !== "signed_in" ||
    available.length === 0 ||
    (hideSingle && available.length === 1)
  )
    return null;

  const isStandaloneSidebar = vertical && tone === "light";
  const darkSurface = tone === "dark" || isStandaloneSidebar;

  return (
    <View
      accessibilityLabel="Available workspaces"
      style={[
        styles.container,
        vertical ? styles.containerVertical : styles.containerHorizontal,
        tone === "dark" && styles.containerDark,
      ]}
    >
      {isStandaloneSidebar ? (
        <>
          <View style={styles.brandBannerCard}>
            <Image
              accessibilityLabel="CAP Mastery — Mastering Cadet Milestone Tests"
              resizeMode="contain"
              source={capMasteryBanner}
              style={styles.brandBannerImage}
            />
          </View>
          <View style={styles.silverRule} />
        </>
      ) : null}

      <Text style={[styles.heading, darkSurface && styles.headingDark]}>Workspaces</Text>
      <View style={[styles.links, vertical ? styles.linksVertical : styles.linksHorizontal]}>
        {available.map((workspace) => {
          const active = isWorkspaceActive(pathname, workspace.area);
          return (
            <Link asChild href={workspace.href} key={workspace.area}>
              <Pressable
                accessibilityRole="link"
                accessibilityState={{ selected: active }}
                style={StyleSheet.flatten([
                  styles.link,
                  darkSurface && styles.linkDark,
                  active && (darkSurface ? styles.linkActiveDark : styles.linkActive),
                ])}
              >
                <Ionicons
                  color={
                    darkSurface
                      ? active
                        ? "#FFFFFF"
                        : "#CBD5E1"
                      : active
                        ? theme.colors.surface
                        : theme.colors.primary
                  }
                  name={workspace.icon}
                  size={18}
                />
                <Text
                  style={[
                    styles.linkText,
                    darkSurface && styles.linkTextDark,
                    active && (darkSurface ? styles.linkTextActiveDark : styles.linkTextActive),
                  ]}
                >
                  {workspace.label}
                </Text>
                {active && darkSurface ? <View style={styles.activeDot} /> : null}
              </Pressable>
            </Link>
          );
        })}
      </View>
      {isStandaloneSidebar ? (
        <View style={{ marginTop: "auto" }}>
          <InstallButton dark />
        </View>
      ) : null}
    </View>
  );
}

function isWorkspaceActive(pathname: string, area: ProtectedArea) {
  if (area === "content-review") return pathname === "/content-review";
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
  activeDot: {
    backgroundColor: "#BA121A",
    borderColor: "#FFFFFF",
    borderRadius: 5,
    borderWidth: 1.5,
    height: 9,
    marginLeft: "auto",
    width: 9,
  },
  brandBannerCard: {
    alignItems: "center",
    backgroundColor: "#ECF0F5",
    borderColor: "#CBD5E1",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    height: 74,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
    width: "100%",
  },
  brandBannerImage: {
    height: "100%",
    width: "100%",
  },
  silverRule: {
    backgroundColor: "#183B70",
    height: 1,
    marginVertical: 2,
  },
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
  containerDark: {
    backgroundColor: "transparent",
    borderColor: "#183B70",
    borderRightWidth: 0,
    borderTopWidth: 1,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingTop: theme.spacing.md,
    width: "100%",
  },
  containerVertical: {
    backgroundColor: theme.colors.primary,
    borderRightColor: "#163564",
    borderRightWidth: 1,
    gap: theme.spacing.md,
    minWidth: 280,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: 12,
    paddingTop: theme.spacing.lg,
    width: 280,
  },
  heading: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.9,
    paddingHorizontal: 4,
    textTransform: "uppercase",
  },
  headingDark: { color: "#94A3B8" },
  link: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  linkActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  linkActiveDark: {
    backgroundColor: "#0D3573",
    borderColor: "#265399",
  },
  linkDark: { minHeight: 44 },
  linkText: { color: theme.colors.primary, fontSize: 14, fontWeight: "800" },
  linkTextActive: { color: theme.colors.surface },
  linkTextActiveDark: { color: "#FFFFFF", fontWeight: "900" },
  linkTextDark: { color: "#CBD5E1" },
  links: { gap: 6 },
  linksHorizontal: { flexDirection: "row", flexWrap: "wrap" },
  linksVertical: { alignItems: "stretch" },
});
