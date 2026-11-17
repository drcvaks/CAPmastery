import type { PropsWithChildren } from "react";
import { Ionicons } from "@expo/vector-icons";
import { type Href, Link } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../../../lib/constants/theme";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const capMasteryLogo = require("../../../assets/cap-mastery-logo.png");

const HIGHLIGHTS = [
  {
    icon: "book" as const,
    shortLabel: "Study Packets",
    title: "Wright Brothers, Mitchell & Earhart Prep",
    description:
      "Follow chapter-by-chapter Learn to Lead and Aerospace Dimensions study packets with page-cited explanations.",
  },
  {
    icon: "checkmark-circle" as const,
    shortLabel: "Readiness Coach",
    title: "Daily Missions & Skill Readiness",
    description:
      "Complete quick daily missions, track your accuracy and mastery level, and see which chapter to focus on next.",
  },
  {
    icon: "trophy" as const,
    shortLabel: "Practice Tests",
    title: "50-Question Practice Exams & Challenges",
    description:
      "Take realistic milestone practice tests, unlock memory tricks and visuals, and team up on family study challenges.",
  },
] as const;

type AuthShowcaseFrameProps = PropsWithChildren<{
  activeTab?: "sign-in" | "sign-up" | "recovery";
  title: string;
  subtitle: string;
  errorMessage?: string | null;
  statusMessage?: string | null;
}>;

export function AuthShowcaseFrame({
  activeTab = "sign-in",
  title,
  subtitle,
  errorMessage,
  statusMessage,
  children,
}: AuthShowcaseFrameProps) {
  const { width } = useWindowDimensions();
  const desktopSplit = width >= 860;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, desktopSplit && styles.scrollContentDesktop]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, desktopSplit && styles.containerDesktop]}>
          {desktopSplit ? <DesktopShowcaseCard /> : <CompactShowcaseBanner />}

          <View style={[styles.authCard, desktopSplit && styles.authCardDesktop]}>
            {activeTab !== "recovery" ? (
              <View style={styles.segmentedTrack}>
                <Link asChild href={"/sign-in" as Href}>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityState={{ selected: activeTab === "sign-in" }}
                    style={StyleSheet.flatten([
                      styles.segmentButton,
                      activeTab === "sign-in" && styles.segmentButtonActive,
                    ])}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        activeTab === "sign-in" && styles.segmentTextActive,
                      ]}
                    >
                      Sign In
                    </Text>
                  </Pressable>
                </Link>
                <Link asChild href={"/sign-up" as Href}>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityState={{ selected: activeTab === "sign-up" }}
                    style={StyleSheet.flatten([
                      styles.segmentButton,
                      activeTab === "sign-up" && styles.segmentButtonActive,
                    ])}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        activeTab === "sign-up" && styles.segmentTextActive,
                      ]}
                    >
                      Join CAP Mastery
                    </Text>
                  </Pressable>
                </Link>
              </View>
            ) : null}

            <View style={styles.formHeader}>
              <Text accessibilityRole="header" style={styles.formTitle}>
                {title}
              </Text>
              <Text style={styles.formSubtitle}>{subtitle}</Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons color={theme.colors.danger} name="alert-circle" size={18} />
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {statusMessage ? (
              <View style={styles.statusBanner}>
                <Ionicons color={theme.colors.success} name="checkmark-circle" size={18} />
                <Text accessibilityRole="alert" style={styles.statusText}>
                  {statusMessage}
                </Text>
              </View>
            ) : null}

            <View style={styles.formBody}>{children}</View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DesktopShowcaseCard() {
  return (
    <View style={styles.showcaseCard}>
      <View style={styles.logoFrame}>
        <Image
          accessibilityLabel="CAP Mastery emblem"
          resizeMode="contain"
          source={capMasteryLogo}
          style={styles.logoImage}
        />
      </View>

      <View style={styles.programBadge}>
        <Ionicons color="#BA121A" name="shield-checkmark" size={13} />
        <Text style={styles.programBadgeText}>CIVIL AIR PATROL CADET STUDY COACH</Text>
      </View>

      <Text style={styles.showcaseTitle}>Structured Milestone Exam Prep for Every Cadet</Text>
      <Text style={styles.showcaseSubtitle}>Sign in with your CAP Mastery email and password.</Text>

      <View style={styles.showcaseDivider} />

      <View style={styles.featureList}>
        {HIGHLIGHTS.map((item) => (
          <View key={item.title} style={styles.featureRow}>
            <View style={styles.featureIconTile}>
              <Ionicons color="#BA121A" name={item.icon} size={18} />
            </View>
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureDescription}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function CompactShowcaseBanner() {
  return (
    <View style={styles.compactCard}>
      <View style={styles.compactTopRow}>
        <View style={styles.compactLogoFrame}>
          <Image
            accessibilityLabel="CAP Mastery emblem"
            resizeMode="contain"
            source={capMasteryLogo}
            style={styles.compactLogoImage}
          />
        </View>
        <View style={styles.compactHeaderCopy}>
          <View style={styles.compactBadge}>
            <Ionicons color="#BA121A" name="shield-checkmark" size={11} />
            <Text style={styles.compactBadgeText}>CIVIL AIR PATROL</Text>
          </View>
          <Text style={styles.compactTitle}>CAP Mastery</Text>
          <Text style={styles.compactSubtitle}>
            Wright Brothers, Mitchell & Earhart milestone study coach.
          </Text>
        </View>
      </View>

      <View style={styles.compactPillsRow}>
        {HIGHLIGHTS.map((item) => (
          <View key={item.shortLabel} style={styles.compactFeaturePill}>
            <Ionicons color="#F87171" name={item.icon} size={13} />
            <Text style={styles.compactFeaturePillText}>{item.shortLabel}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#EEF2F7",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  scrollContentDesktop: {
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  container: {
    alignSelf: "center",
    gap: 16,
    maxWidth: 480,
    width: "100%",
  },
  containerDesktop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 32,
    justifyContent: "center",
    maxWidth: 1000,
  },
  showcaseCard: {
    alignItems: "center",
    backgroundColor: "#042454",
    borderColor: "#163B73",
    borderRadius: 24,
    borderWidth: 1,
    flex: 1.08,
    gap: 14,
    maxWidth: 480,
    paddingHorizontal: 32,
    paddingVertical: 34,
    shadowColor: "#02122C",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 6,
  },
  logoFrame: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 34,
    height: 196,
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    width: 196,
  },
  logoImage: {
    height: "100%",
    width: "100%",
  },
  programBadge: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  programBadgeText: {
    color: "#042454",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  showcaseTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 30,
    textAlign: "center",
  },
  showcaseSubtitle: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    textAlign: "center",
  },
  showcaseDivider: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    height: 1,
    marginVertical: 4,
    width: "100%",
  },
  featureList: {
    gap: 14,
    width: "100%",
  },
  featureRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  featureIconTile: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1.5,
    height: 36,
    justifyContent: "center",
    marginTop: 1,
    width: 36,
  },
  featureCopy: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  featureDescription: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 17,
  },
  compactCard: {
    backgroundColor: "#042454",
    borderColor: "#163B73",
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    shadowColor: "#02122C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  compactTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  compactLogoFrame: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 14,
    height: 74,
    justifyContent: "center",
    overflow: "hidden",
    width: 74,
  },
  compactLogoImage: {
    height: "100%",
    width: "100%",
  },
  compactHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  compactBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  compactBadgeText: {
    color: "#042454",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  compactTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  compactSubtitle: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 17,
  },
  compactPillsRow: {
    borderTopColor: "rgba(255, 255, 255, 0.14)",
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 10,
  },
  compactFeaturePill: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  compactFeaturePillText: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "700",
  },
  authCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCE4EF",
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 24,
    shadowColor: "#042454",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    width: "100%",
  },
  authCardDesktop: {
    flex: 1,
    maxWidth: 460,
    padding: 28,
  },
  segmentedTrack: {
    backgroundColor: "#E8EFF8",
    borderColor: "#D8E2F0",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  segmentButton: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentButtonActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    shadowColor: "#042454",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#042454",
    fontWeight: "800",
  },
  formHeader: {
    gap: 4,
  },
  formTitle: {
    color: "#042454",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  formSubtitle: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },
  errorBanner: {
    alignItems: "center",
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.dangerBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: theme.colors.danger,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  statusBanner: {
    alignItems: "center",
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusText: {
    color: theme.colors.success,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  formBody: {
    gap: 14,
  },
});
