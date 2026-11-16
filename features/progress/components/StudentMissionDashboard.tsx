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
  const splitLayout = Platform.OS === "web" && width >= 980;
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
      maxContentWidth={splitLayout ? 1400 : 1080}
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
            <View style={styles.heroCard}>
              <View style={styles.heroBanner}>
                <View style={styles.eyebrowPill}>
                  <View style={styles.eyebrowDot} />
                  <Text style={styles.eyebrow}>TODAY’S MISSION</Text>
                </View>
                <View style={styles.timeBadge}>
                  <Text style={styles.bodyLight}>Estimated time: ~4–5 minutes</Text>
                </View>
              </View>

              <View style={styles.heroBody}>
                <View style={styles.heroProgressSection}>
                  <View style={styles.heroTitleRow}>
                    <Text style={styles.heroTitle}>
                      {data.today_count >= 10 ? "Mission Complete!" : "Complete 10 questions"}
                    </Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.count}>{Math.min(data.today_count, 10)} / 10 complete</Text>
                    </View>
                  </View>

                  <MissionProgress count={data.today_count} goal={10} label="Today's mission" />

                  <Text style={styles.body}>
                    Daily and weekly goals include effort across all your study tracks.
                  </Text>
                  <Text style={styles.encouragementText}>
                    {data.today_count >= 10
                      ? "Checkpoint reached. Every answer is another step forward."
                      : "Every answer counts — learning comes from practice."}
                  </Text>
                </View>

                {data.exams.length > 0 ? (
                  <View style={styles.controlPanel}>
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
                    <View style={styles.currentTrackBanner}>
                      <Text style={styles.label}>Current track: {selectedExam?.title}</Text>
                      <Text style={styles.bodySmall}>
                        Switch tracks whenever you like. Your saved answers stay with each mission.
                      </Text>
                    </View>
                    {!activeSessionId ? (
                      <View style={styles.durationSection}>
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
                      </View>
                    ) : null}
                  </View>
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
            </View>

            {!splitLayout && selectedExam ? (
              <TrackCoverageCard key={selectedExam.id} track={selectedExam} />
            ) : null}

            <View style={styles.subCardGrid}>
              <View style={styles.subCardCol}>
                <AppCard
                  title={checkpoint ? "Next Checkpoint" : "Strong Session — checkpoint reached"}
                >
                  {reached ? (
                    <View style={styles.reachedBadge}>
                      <Text style={styles.reachedText}>
                        {reached.title}! {data.today_count} questions completed today.
                      </Text>
                    </View>
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
              </View>

              <View style={styles.subCardCol}>
                <AppCard title="This Week">
                  <View style={styles.thisWeekBox}>
                    <Text style={styles.weeklyCount}>{data.weekly_count} questions completed</Text>
                    <Text style={styles.body}>Practice logged. Progress made.</Text>
                  </View>
                </AppCard>
              </View>
            </View>

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
              <View style={styles.weeklyStatsRow}>
                <Text style={styles.weeklyCount}>
                  {data.weekly_count} / {data.weekly_goal} questions
                </Text>
              </View>
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
          </View>

          {splitLayout && selectedExam ? (
            <View
              accessibilityLabel="Your route panel"
              style={[styles.routeColumn, { width: width >= 1440 ? 400 : 350 }]}
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
      style={({ pressed }) => [
        styles.choice,
        selected && styles.selected,
        pressed && !disabled && styles.choicePressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.choiceText, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dashboard: { gap: 16, width: "100%" },
  dashboardSplit: { flexDirection: "row", alignItems: "flex-start" },
  missionColumn: { minWidth: 0, gap: 16 },
  missionColumnSplit: { flex: 1 },
  routeColumn: { flexShrink: 0, minWidth: 0 },
  subCardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  subCardCol: {
    flexBasis: 280,
    flexGrow: 1,
    minWidth: 0,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroBanner: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderBottomColor: theme.colors.gold,
    borderBottomWidth: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  eyebrowPill: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  eyebrowDot: {
    backgroundColor: theme.colors.goldBright,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  eyebrow: {
    color: theme.colors.surface,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  timeBadge: {
    backgroundColor: "#163B6B",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bodyLight: {
    color: "#D8E6F0",
    fontSize: 12,
    fontWeight: "600",
  },
  heroBody: {
    gap: 16,
    padding: 20,
  },
  heroProgressSection: {
    gap: 8,
  },
  heroTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
  },
  heroTitle: {
    color: theme.colors.ink,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  count: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  body: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  bodySmall: { color: theme.colors.muted, fontSize: 13, lineHeight: 18 },
  encouragementText: {
    color: theme.colors.inkSecondary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  controlPanel: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  currentTrackBanner: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    gap: 2,
    padding: 10,
  },
  durationSection: {
    gap: 8,
  },
  label: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: "center",
  },
  choicePressed: { opacity: 0.85 },
  choiceText: { color: theme.colors.inkSecondary, fontSize: 13, fontWeight: "700" },
  selected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectedText: { color: theme.colors.surface },
  disabled: { opacity: 0.45 },
  track: {
    backgroundColor: theme.colors.borderSoft,
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: theme.colors.success,
    borderRadius: 999,
    height: "100%",
  },
  reachedBadge: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    padding: 10,
  },
  reachedText: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: "800",
  },
  checkpoint: { color: theme.colors.success, fontSize: 15, fontWeight: "800", lineHeight: 22 },
  weeklyStatsRow: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weeklyCount: { color: theme.colors.ink, fontSize: 20, fontWeight: "800" },
  thisWeekBox: {
    gap: 4,
  },
  error: { color: theme.colors.danger, fontSize: 13, fontWeight: "700" },
});
