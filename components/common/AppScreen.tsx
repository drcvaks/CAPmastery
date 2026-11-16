import { type PropsWithChildren, type ReactNode, type Ref, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePathname } from "expo-router";

import { useOptionalAuth } from "../../features/auth/AuthContext";
import type { AppRole } from "../../features/auth/types";
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

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  const clean = (name ?? "").trim();
  if (clean) {
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "CM";
}

function getPrimaryRoleLabel(roles: AppRole[]): string {
  if (roles.includes("admin")) return "Global Admin";
  if (roles.includes("content_reviewer")) return "Content Reviewer";
  if (roles.includes("content_tester")) return "Content Tester";
  if (roles.includes("parent") && roles.includes("student")) return "Cadet & Family";
  if (roles.includes("parent")) return "Parent / Coach";
  if (roles.includes("student")) return "Cadet";
  return "Member";
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const hasStudentWebSidebar =
    Platform.OS === "web" &&
    width >= 900 &&
    (pathname === "/home" ||
      pathname.startsWith("/study") ||
      pathname.startsWith("/progress") ||
      pathname.startsWith("/challenge"));

  const isSignedIn = auth?.status === "signed_in";
  const profile = isSignedIn ? auth.access?.profile : null;
  const roles = isSignedIn ? (auth.access?.roles ?? []) : [];
  const displayName = profile?.display_name?.trim() || profile?.first_name?.trim() || null;
  const firstName =
    profile?.first_name?.trim() || profile?.display_name?.trim().split(/\s+/)[0] || null;
  const email = profile?.email || auth?.session?.user?.email || null;
  const accountStatus = profile?.status ?? "active";
  const roleLabel = getPrimaryRoleLabel(roles);
  const initials = getInitials(displayName ?? firstName, email);

  async function handleSignOut() {
    if (!auth?.signOut) return;
    setSigningOut(true);
    try {
      await auth.signOut();
    } catch {
      // Ignore signOut errors
    } finally {
      setSigningOut(false);
      setMenuOpen(false);
    }
  }

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
            <View
              style={[
                styles.topHeaderInner,
                wide && styles.topHeaderInnerWide,
                { maxWidth: maxContentWidth },
              ]}
            >
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
                  {actions ? <View style={styles.actions}>{actions}</View> : null}
                  {firstName ? (
                    <Pressable
                      accessibilityLabel={`Account menu for ${displayName ?? firstName}`}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: menuOpen }}
                      onPress={() => setMenuOpen((prev) => !prev)}
                      style={({ pressed }) => [
                        styles.accountTrigger,
                        menuOpen && styles.accountTriggerActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.triggerAvatar}>
                        <Text style={styles.triggerAvatarText}>{initials}</Text>
                      </View>
                      <View style={styles.triggerCopy}>
                        <Text numberOfLines={1} style={styles.triggerName}>
                          {displayName ?? firstName}
                        </Text>
                        <View style={styles.triggerMetaRow}>
                          <Text style={styles.triggerRole}>{roleLabel}</Text>
                          <Text style={styles.triggerDot}>·</Text>
                          <Text style={styles.identity}>Hello, {firstName}</Text>
                        </View>
                      </View>
                      <Ionicons
                        color={theme.colors.inkSecondary}
                        name={menuOpen ? "chevron-up" : "chevron-down"}
                        size={16}
                      />
                    </Pressable>
                  ) : null}
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

      {firstName ? (
        <Modal
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
          transparent
          visible={menuOpen}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setMenuOpen(false)}>
            <Pressable
              accessibilityLabel="Account menu"
              onPress={(event) => event.stopPropagation()}
              style={[styles.dropdownCard, wide ? styles.dropdownCardWide : styles.dropdownCardMobile]}
            >
              <View style={styles.dropdownHeader}>
                <View style={styles.dropdownAvatar}>
                  <Text style={styles.dropdownAvatarText}>{initials}</Text>
                </View>
                <View style={styles.dropdownIdentityCopy}>
                  <Text numberOfLines={1} style={styles.dropdownName}>
                    {displayName ?? firstName}
                  </Text>
                  <Text numberOfLines={1} style={styles.dropdownEmail}>
                    {email ?? "Signed-in account"}
                  </Text>
                  <View style={styles.dropdownBadgesRow}>
                    <View style={styles.rolePill}>
                      <Text style={styles.rolePillText}>{roleLabel}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        accountStatus === "disabled" && styles.statusPillDisabled,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          accountStatus === "disabled" && styles.statusDotDisabled,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          accountStatus === "disabled" && styles.statusPillTextDisabled,
                        ]}
                      >
                        {accountStatus === "disabled" ? "Disabled" : "Active"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.dropdownDivider} />

              <Pressable
                accessibilityLabel="Sign Out"
                accessibilityRole="button"
                disabled={signingOut}
                onPress={() => void handleSignOut()}
                style={({ pressed }) => [
                  styles.signOutMenuItem,
                  pressed && styles.pressed,
                ]}
              >
                {signingOut ? (
                  <ActivityIndicator color={theme.colors.danger} size="small" />
                ) : (
                  <Ionicons color={theme.colors.danger} name="log-out-outline" size={19} />
                )}
                <Text style={styles.signOutMenuText}>Sign Out</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
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
    paddingVertical: 18,
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
    backgroundColor: theme.colors.accent,
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
    maxWidth: 700,
  },
  headerRight: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  accountTrigger: {
    alignItems: "center",
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  accountTriggerActive: {
    borderColor: theme.colors.primary,
  },
  triggerAvatar: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.accent,
    borderRadius: 18,
    borderWidth: 1.5,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  triggerAvatarText: {
    color: theme.colors.surface,
    fontSize: 13,
    fontWeight: "900",
  },
  triggerCopy: {
    gap: 1,
    maxWidth: 200,
  },
  triggerName: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  triggerMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  triggerRole: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  triggerDot: {
    color: theme.colors.subtle,
    fontSize: 11,
  },
  identity: {
    color: theme.colors.inkSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
  modalBackdrop: {
    backgroundColor: "rgba(2, 22, 54, 0.18)",
    flex: 1,
  },
  dropdownCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    padding: 18,
    position: "absolute",
    shadowColor: "#021636",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
    width: 296,
  },
  dropdownCardWide: {
    right: 32,
    top: 72,
  },
  dropdownCardMobile: {
    right: 16,
    top: 84,
  },
  dropdownHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  dropdownAvatar: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.accent,
    borderRadius: 24,
    borderWidth: 2,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  dropdownAvatarText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  dropdownIdentityCopy: {
    flex: 1,
    gap: 3,
  },
  dropdownName: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  dropdownEmail: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  dropdownBadgesRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  rolePill: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  rolePillText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  statusPill: {
    alignItems: "center",
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusPillDisabled: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.dangerBorder,
  },
  statusDot: {
    backgroundColor: theme.colors.success,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  statusDotDisabled: {
    backgroundColor: theme.colors.danger,
  },
  statusPillText: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: "800",
  },
  statusPillTextDisabled: {
    color: theme.colors.danger,
  },
  dropdownDivider: {
    backgroundColor: theme.colors.borderSoft,
    height: 1,
    width: "100%",
  },
  signOutMenuItem: {
    alignItems: "center",
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.dangerBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  signOutMenuText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: "800",
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
