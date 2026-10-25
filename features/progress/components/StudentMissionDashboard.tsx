import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { type Href, useRouter } from "expo-router";
import { AppScreen } from "../../../components/common/AppScreen";
import { AppCard } from "../../../components/common/AppCard";
import { AppButton } from "../../../components/common/AppButton";
import { theme } from "../../../lib/constants/theme";
import { SignOutButton } from "../../auth/components/SignOutButton";
import { useCreateStudySession } from "../../study/hooks/useStudySession";
import { useStudentMissions, useSetWeeklyMission } from "../hooks/useStudentMissions";
import { crossedMissionCheckpoint, nextMissionCheckpoint } from "../missions";
import { TrackCoverageCard } from "./TrackCoverageCard";

const goals = [
  { label: "Light", count: 25 },
  { label: "Standard", count: 50 },
  { label: "Strong", count: 100 },
] as const;

export function StudentMissionDashboard() {
  const { width } = useWindowDimensions();
  const splitLayout = Platform.OS === "web" && width >= 1280;
  const router = useRouter();
  const mission = useStudentMissions();
  const weekly = useSetWeeklyMission();
  const launch = useCreateStudySession();
  const [examId, setExamId] = useState<string>();
  const [questionCount, setQuestionCount] = useState<5 | 10 | 20>(10);
  const data = mission.data;
  const selectedExam =
    data?.exams.find((exam) => exam.id === examId) ??
    data?.exams.find(
      (exam) =>
        exam.active_session_id === data.active_session_id && exam.active_session_id !== null,
    ) ??
    data?.exams[0];
  const activeSessionId = selectedExam?.active_session_id;
  const checkpoint = nextMissionCheckpoint(data?.today_count ?? 0);
  const reached = crossedMissionCheckpoint(0, data?.today_count ?? 0);

  function start() {
    if (activeSessionId) {
      router.push(`/study/session/${activeSessionId}` as Href);
    } else if (selectedExam) {
      void launch
        .mutateAsync({ examId: selectedExam.id, questionCount })
        .then((id) => router.push(`/study/session/${id}` as Href))
        .catch(() => undefined);
    }
  }

  return (
    <AppScreen
      eyebrow="Student Home"
      title="Your next mission"
      description="A few minutes. A little practice. Another checkpoint reached."
      actions={<SignOutButton />}
      maxContentWidth={splitLayout ? 1440 : 1040}
    >
      {mission.isPending ? (
        <AppCard title="Preparing your mission" description="Loading your latest progress…" />
      ) : mission.isError || !data ? (
        <AppCard
          title="Mission progress unavailable"
          description="Check your connection and try again."
        >
          <AppButton label="Try again" onPress={() => void mission.refetch()} />
        </AppCard>
      ) : (
        <View style={[styles.dashboard, splitLayout && styles.dashboardSplit]}>
          <View style={[styles.missionColumn, splitLayout && styles.missionColumnSplit]}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>TODAY’S MISSION</Text>
              <Text style={styles.heroTitle}>
                {data.today_count >= 10 ? "Mission Complete!" : "Complete 10 questions"}
              </Text>
              <Text style={styles.body}>Estimated time: ~4–5 minutes</Text>
              <Text style={styles.count}>{Math.min(data.today_count, 10)} / 10 complete</Text>
              <MissionProgress count={data.today_count} goal={10} label="Today's mission" />
              <Text style={styles.body}>
                Daily and weekly goals include effort across all your study tracks.
              </Text>
              <Text style={styles.body}>
                {data.today_count >= 10
                  ? "Checkpoint reached. Every answer is another step forward."
                  : "Every answer counts — learning comes from practice."}
              </Text>
              {data.exams.length > 0 ? (
                <>
                  <Text style={styles.label}>Choose your study track</Text>
                  <View style={styles.options}>
                    {data.exams.map((exam) => (
                      <Choice
                        key={exam.id}
                        label={exam.title}
                        selected={selectedExam?.id === exam.id}
                        disabled={launch.isPending}
                        onPress={() => setExamId(exam.id)}
                      />
                    ))}
                  </View>
                  <Text style={styles.label}>Current track: {selectedExam?.title}</Text>
                  <Text style={styles.body}>
                    Switch tracks whenever you like. Your saved answers stay with each mission.
                  </Text>
                  {!activeSessionId ? (
                    <>
                      <Text style={styles.label}>How much time do you have?</Text>
                      <View style={styles.options}>
                        {([5, 10, 20] as const).map((count) => (
                          <Choice
                            key={count}
                            label={`${count} questions`}
                            selected={questionCount === count}
                            disabled={
                              launch.isPending || (selectedExam?.available_count ?? 0) < count
                            }
                            onPress={() => setQuestionCount(count)}
                          />
                        ))}
                      </View>
                    </>
                  ) : null}
                </>
              ) : null}
              <AppButton
                label={
                  activeSessionId
                    ? `Continue ${selectedExam?.title} mission`
                    : data.today_count >= 10
                      ? "Start another mission"
                      : "Start Mission"
                }
                onPress={start}
                loading={launch.isPending}
                disabled={
                  !activeSessionId &&
                  (!selectedExam || selectedExam.available_count < questionCount)
                }
              />
              {!data.exams.length ? (
                <Text style={styles.body}>
                  Your study track will appear after an administrator assigns content.
                </Text>
              ) : null}
              {launch.isError ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  Your mission could not start. Try again or choose a shorter session.
                </Text>
              ) : null}
            </View>
            {!splitLayout && selectedExam ? (
              <TrackCoverageCard key={selectedExam.id} track={selectedExam} />
            ) : null}
            <AppCard title={checkpoint ? "Next Checkpoint" : "Strong Session — checkpoint reached"}>
              {reached ? (
                <Text style={styles.label}>
                  {reached.title}! {data.today_count} questions completed today.
                </Text>
              ) : null}
              <Text style={styles.checkpoint}>
                {checkpoint
                  ? `${checkpoint.count - data.today_count} more questions → ${checkpoint.title}`
                  : `You completed ${data.today_count} questions today.`}
              </Text>
              <Text style={styles.body}>
                {checkpoint
                  ? "A small next step. You can do it a few questions at a time."
                  : "Your effort is recorded. Take a break, or keep studying when you are ready."}
              </Text>
            </AppCard>
            <AppCard
              title="Weekly Mission"
              description="Choose a pace that fits your week. Monday through Sunday, in your local time."
            >
              <View style={styles.options}>
                {goals.map((goal) => (
                  <Choice
                    key={goal.count}
                    label={`${goal.label} · ${goal.count}`}
                    selected={data.weekly_goal === goal.count}
                    disabled={weekly.isPending}
                    onPress={() => void weekly.mutateAsync(goal.count).catch(() => undefined)}
                  />
                ))}
              </View>
              <Text style={styles.weeklyCount}>
                {data.weekly_count} / {data.weekly_goal} questions
              </Text>
              <MissionProgress
                count={data.weekly_count}
                goal={data.weekly_goal}
                label="Weekly mission"
              />
              <Text style={styles.checkpoint}>
                {data.weekly_count >= data.weekly_goal
                  ? "Weekly Mission Complete!"
                  : `${data.weekly_goal - data.weekly_count} questions to complete your weekly mission`}
              </Text>
              {weekly.isError ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  Your goal was not saved. Please try again.
                </Text>
              ) : null}
            </AppCard>
            <AppCard title="This Week">
              <Text style={styles.weeklyCount}>{data.weekly_count} questions completed</Text>
              <Text style={styles.body}>Practice logged. Progress made.</Text>
            </AppCard>
          </View>
          {splitLayout && selectedExam ? (
            <View
              accessibilityLabel="Your route panel"
              style={[styles.routeColumn, { width: width >= 1600 ? 400 : 360 }]}
            >
              <TrackCoverageCard key={selectedExam.id} track={selectedExam} />
            </View>
          ) : null}
        </View>
      )}
    </AppScreen>
  );
}

function MissionProgress({ count, goal, label }: { count: number; goal: number; label: string }) {
  const progress = Math.min(count, goal);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{
        min: 0,
        max: goal,
        now: progress,
        text: `${count} of ${goal} questions`,
      }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${(progress / goal) * 100}%` }]} />
    </View>
  );
}

function Choice({
  label,
  selected,
  disabled = false,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.choice, selected && styles.selected, disabled && styles.disabled]}
    >
      <Text style={[styles.choiceText, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dashboard: { gap: theme.spacing.lg, width: "100%" },
  dashboardSplit: { flexDirection: "row", alignItems: "flex-start" },
  missionColumn: { minWidth: 0, gap: theme.spacing.lg },
  missionColumnSplit: { flex: 1 },
  routeColumn: { flexShrink: 0, minWidth: 0 },
  hero: {
    backgroundColor: "#E7F2F9",
    borderColor: "#A9CCDF",
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  eyebrow: { color: theme.colors.accent, fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  heroTitle: { color: theme.colors.primary, fontSize: 30, fontWeight: "900" },
  body: { color: theme.colors.muted, fontSize: 15, lineHeight: 23 },
  count: { color: theme.colors.primary, fontSize: 24, fontWeight: "900" },
  label: { color: theme.colors.primary, fontSize: 14, fontWeight: "800" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  choice: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    minHeight: 46,
    padding: theme.spacing.sm,
    justifyContent: "center",
  },
  choiceText: { color: theme.colors.primary, fontSize: 14, fontWeight: "800" },
  selected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  selectedText: { color: theme.colors.surface },
  disabled: { opacity: 0.5 },
  track: { backgroundColor: "#CFDDE6", borderRadius: 8, height: 12, overflow: "hidden" },
  fill: { backgroundColor: theme.colors.success, borderRadius: 8, height: "100%" },
  checkpoint: { color: theme.colors.success, fontSize: 17, fontWeight: "800", lineHeight: 25 },
  weeklyCount: { color: theme.colors.primary, fontSize: 25, fontWeight: "900" },
  error: { color: theme.colors.danger, fontSize: 14 },
});
