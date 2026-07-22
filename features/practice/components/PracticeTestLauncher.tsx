import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { type Href, useRouter } from "expo-router";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { theme } from "../../../lib/constants/theme";
import { getSafeStudyMessage } from "../../study/errors";
import { useCreatePracticeTest, usePracticeTestOptions } from "../hooks/usePracticeTest";

export function PracticeTestLauncher({ examId }: { examId: string }) {
  const router = useRouter();
  const options = usePracticeTestOptions();
  const createTest = useCreatePracticeTest();
  const [timed, setTimed] = useState(true);
  const option = options.data?.find((item) => item.exam_id === examId);

  if (options.isPending) {
    return <AppCard title="Practice test" description="Loading the practice-test blueprint…" />;
  }
  if (options.isError) {
    return (
      <AppCard title="Practice test unavailable" description="The blueprint could not be loaded.">
        <AppButton label="Try again" onPress={() => void options.refetch()} />
      </AppCard>
    );
  }
  if (!option) {
    return (
      <AppCard
        title="Practice test not configured"
        description="This exam does not yet have an active pilot blueprint."
      />
    );
  }

  const minutes = Math.ceil(option.time_limit_seconds / 60);
  return (
    <AppCard title={option.blueprint_name} description={option.description}>
      <Text style={styles.unofficial}>Unofficial study practice—not an official CAP exam.</Text>
      <Text style={styles.detail}>
        {option.question_count} questions · Balanced fixed blueprint · Feedback after completion
      </Text>
      {option.allow_untimed ? (
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>Use {minutes}-minute timer</Text>
            <Text style={styles.muted}>Turn this off for untimed practice.</Text>
          </View>
          <Switch
            accessibilityLabel={`Use ${minutes}-minute timer`}
            onValueChange={setTimed}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            value={timed}
          />
        </View>
      ) : (
        <Text style={styles.detail}>Time limit: {minutes} minutes</Text>
      )}
      <Text style={styles.muted}>
        {option.allow_pause
          ? "This blueprint allows pausing."
          : "Pausing is not available for this blueprint."}
      </Text>
      <AppButton
        label={`Start ${option.question_count}-question practice test`}
        loading={createTest.isPending}
        onPress={() => {
          void createTest
            .mutateAsync({ blueprintId: option.blueprint_id, timed })
            .then((sessionId) => router.push(`/study/session/${sessionId}` as Href))
            .catch(() => undefined);
        }}
      />
      {createTest.isError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {getSafeStudyMessage(createTest.error)}
        </Text>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  detail: { color: theme.colors.ink, fontSize: 14, lineHeight: 21 },
  error: { color: theme.colors.danger, fontSize: 15 },
  muted: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  switchCopy: { flex: 1, gap: 2 },
  switchRow: { alignItems: "center", flexDirection: "row", gap: theme.spacing.md },
  switchTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  unofficial: { color: theme.colors.accent, fontSize: 14, fontWeight: "800", lineHeight: 20 },
});
