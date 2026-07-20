import { StyleSheet, Text, View } from "react-native";

import { AppCard } from "../components/common/AppCard";
import { AppLinkButton } from "../components/common/AppLinkButton";
import { AppScreen } from "../components/common/AppScreen";
import { theme } from "../lib/constants/theme";

export default function WelcomeScreen() {
  return (
    <AppScreen
      eyebrow="Checkpoint 1"
      title="CAP Mastery"
      description="A focused study coach for building knowledge, confidence, and readiness. This checkpoint demonstrates the application shell only."
      actions={
        <>
          <AppLinkButton href="/sign-in" label="Open sign-in shell" />
          <AppLinkButton href="/home" label="Preview student shell" variant="secondary" />
          <AppLinkButton href="/admin" label="Preview admin shell" variant="secondary" />
        </>
      }
    >
      <View style={styles.grid}>
        <AppCard
          title="Learn deliberately"
          description="Adaptive study, explanations, and secure grading arrive in later checkpoints."
        />
        <AppCard
          title="See steady progress"
          description="Readiness and mastery will emphasize improvement without promising official exam outcomes."
        />
        <AppCard
          title="Support the pilot"
          description="Parent and administrative tools will remain scoped, private, and encouraging."
        />
      </View>
      <Text style={styles.note}>No Supabase connection or account is required for this shell.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: theme.spacing.md,
  },
  note: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
});
