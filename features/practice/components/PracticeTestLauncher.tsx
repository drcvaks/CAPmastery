import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { type Href, useRouter } from "expo-router";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { theme } from "../../../lib/constants/theme";
import { getSafeStudyMessage } from "../../study/errors";
import { useCreatePracticeTest, usePracticeTestOptions } from "../hooks/usePracticeTest";
import type { PracticeTestOption } from "../schemas";

export function PracticeTestLauncher({ examId }: { examId: string }) {
  const options = usePracticeTestOptions();
  const examOptions = options.data?.filter((item) => item.exam_id === examId) ?? [];

  if (options.isPending) {
    return <AppCard title="Practice test" description="Loading the practice-test blueprints…" />;
  }
  if (options.isError) {
    return (
      <AppCard title="Practice test unavailable" description="The blueprints could not be loaded.">
        <AppButton label="Try again" onPress={() => void options.refetch()} />
      </AppCard>
    );
  }
  if (!examOptions.length) {
    return (
      <AppCard
        title="Practice test not configured"
        description="This exam does not yet have an active pilot blueprint."
      />
    );
  }

  return (
    <View style={styles.stack}>
      {examOptions.map((option) => (
        <PracticeOptionCard key={option.blueprint_id} option={option} />
      ))}
    </View>
  );
}

function PracticeOptionCard({ option }: { option: PracticeTestOption }) {
  const router = useRouter();
  const createTest = useCreatePracticeTest();
  const [timed, setTimed] = useState(true);
  const minutes = Math.ceil(option.time_limit_seconds / 60);
  const isLeadershipFullExam = option.selection_strategy === "mitchell_full_exam";
  const isAerospaceFullExam = option.selection_strategy === "aerospace_full_exam";
  const isFullExam = isLeadershipFullExam || isAerospaceFullExam;
  const coverageLabel = isLeadershipFullExam
    ? "Chapters 4–8 exam pool"
    : isAerospaceFullExam
      ? "Modules 1–7 exam pool"
      : "Chapter 1 legacy pilot blueprint";

  return (
    <AppCard title={option.blueprint_name} description={option.description}>
      <Text style={styles.unofficial}>Unofficial study practice—not an official CAP exam.</Text>
      <Text style={styles.detail}>
        {option.question_count} questions · {coverageLabel} · Feedback after completion
      </Text>
      {isLeadershipFullExam ? (
        <Text style={styles.muted}>
          Every form uses 7–13 questions from each chapter, favors high exam-likeness questions, and
          avoids duplicate question families.
        </Text>
      ) : null}
      {isAerospaceFullExam ? (
        <Text style={styles.muted}>
          Every form balances all seven Aerospace Dimensions modules, favors high exam-likeness
          questions, and avoids duplicate question families.
        </Text>
      ) : null}
      {!isFullExam ? (
        <Text style={styles.muted}>
          This is the original Chapter 1 pilot. Chapters 4–8 are currently covered by the separate
          50-question Mitchell practice test.
        </Text>
      ) : null}
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
            .mutateAsync({
              blueprintId: option.blueprint_id,
              timed,
              strategy: option.selection_strategy,
            })
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
  stack: { gap: theme.spacing.lg },
  switchCopy: { flex: 1, gap: 2 },
  switchRow: { alignItems: "center", flexDirection: "row", gap: theme.spacing.md },
  switchTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  unofficial: { color: theme.colors.accent, fontSize: 14, fontWeight: "800", lineHeight: 20 },
});
