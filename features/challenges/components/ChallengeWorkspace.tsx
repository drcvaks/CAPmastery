import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppLinkButton } from "../../../components/common/AppLinkButton";
import { AppScreen } from "../../../components/common/AppScreen";
import { AppTextField } from "../../../components/common/AppTextField";
import { theme } from "../../../lib/constants/theme";
import { useAuth } from "../../auth/AuthProvider";
import { SignOutButton } from "../../auth/components/SignOutButton";
import {
  ENCOURAGEMENT_LABELS,
  encouragementReactionSchema,
  type CreateChallengeInput,
  type PrivateChallenge,
} from "../schemas";
import {
  useChallengeCreationExams,
  useChallengeCreationStudents,
  useChallengeEncouragements,
  useCreatePrivateChallenge,
  usePrivateChallenges,
  useSendChallengeEncouragement,
  useStudentAchievements,
} from "../hooks/useChallenges";

export function ChallengeWorkspace({ audience }: { audience: "guardian" | "student" }) {
  const guardian = audience === "guardian";
  const challenges = usePrivateChallenges();
  const achievements = useStudentAchievements(!guardian);
  const auth = useAuth();

  return (
    <AppScreen
      actions={
        guardian ? (
          <View style={styles.actionRow}>
            <AppLinkButton href="/family-progress" label="View progress" variant="secondary" />
            <SignOutButton />
          </View>
        ) : (
          <SignOutButton />
        )
      }
      description={
        guardian
          ? "Create a private two-student challenge and encourage effort without public rankings."
          : "Complete the shared question set, support your teammate, and earn progress recognition."
      }
      eyebrow={guardian ? "Parent or coach" : "Student"}
      title="Family challenge"
    >
      {guardian ? <CreateChallengeCard /> : null}

      {challenges.isPending ? (
        <AppCard title="Loading challenges" description="Checking your private challenges…" />
      ) : challenges.isError ? (
        <AppCard title="Challenges unavailable" description={safeError(challenges.error)}>
          <AppButton label="Try again" onPress={() => void challenges.refetch()} />
        </AppCard>
      ) : challenges.data.length === 0 ? (
        <AppCard
          title="No private challenges yet"
          description={
            guardian
              ? "Create one after two actively linked students and an approved question set are available."
              : "A linked parent or coach can create a challenge for you."
          }
        />
      ) : (
        challenges.data.map((challenge) => (
          <ChallengeCard
            challenge={challenge}
            currentUserId={auth.session?.user.id ?? ""}
            key={challenge.challenge_id}
          />
        ))
      )}

      {!guardian ? (
        <AppCard
          title="Achievements"
          description="Recognition includes persistence and improvement—not only high scores."
        >
          {achievements.isPending ? <Text style={styles.muted}>Loading achievements…</Text> : null}
          {achievements.isError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {safeError(achievements.error)}
            </Text>
          ) : null}
          {achievements.data?.map((achievement) => (
            <View
              key={achievement.achievement_id}
              style={[styles.achievement, achievement.earned && styles.achievementEarned]}
            >
              <Text style={styles.itemTitle}>
                {achievement.earned ? "Earned · " : ""}
                {achievement.title}
              </Text>
              <Text style={styles.muted}>{achievement.description}</Text>
            </View>
          ))}
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

function CreateChallengeCard() {
  const students = useChallengeCreationStudents(true);
  const exams = useChallengeCreationExams(true);
  const create = useCreatePrivateChallenge();
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
  } = useForm<CreateChallengeInput>({
    defaultValues: {
      title: "Family Study Challenge",
      examId: "",
      studentIds: [],
      questionCount: 5,
    },
    mode: "onChange",
  });
  const studentIds = useWatch({ control, name: "studentIds" });
  const examId = useWatch({ control, name: "examId" });
  const questionCount = useWatch({ control, name: "questionCount" });
  const selectedExam = exams.data?.find((exam) => exam.exam_id === examId);
  const countOptions = [3, 5, 10, 15, 20].filter(
    (count) => !selectedExam || count <= selectedExam.available_question_count,
  );

  function toggleStudent(studentId: string) {
    const selected = studentIds.includes(studentId);
    const next = selected
      ? studentIds.filter((id) => id !== studentId)
      : studentIds.length < 2
        ? [...studentIds, studentId]
        : studentIds;
    setValue("studentIds", next, { shouldValidate: true });
  }

  return (
    <AppCard
      title="Create a private challenge"
      description="Two linked students receive the same approved questions. Results unlock only after both finish."
    >
      <Controller
        control={control}
        name="title"
        rules={{ maxLength: 100, minLength: 3, required: true }}
        render={({ field }) => (
          <AppTextField
            error={errors.title ? "Enter a title from 3 to 100 characters." : undefined}
            label="Challenge title"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />

      <Text style={styles.fieldLabel}>Choose exactly two students</Text>
      {students.isPending ? <Text style={styles.muted}>Loading challenge links…</Text> : null}
      {students.data?.map((student) => {
        const selected = studentIds.includes(student.student_id);
        return (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            key={student.student_id}
            onPress={() => toggleStudent(student.student_id)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={selected ? styles.optionTextSelected : styles.optionText}>
              {student.display_name}
            </Text>
          </Pressable>
        );
      })}
      {students.data && students.data.length < 2 ? (
        <Text style={styles.warning}>
          Two active guardian links with challenge permission are required.
        </Text>
      ) : null}

      <Text style={styles.fieldLabel}>Approved question bank</Text>
      {exams.isPending ? <Text style={styles.muted}>Loading available exams…</Text> : null}
      {exams.data?.map((exam) => {
        const selected = exam.exam_id === examId;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={exam.exam_id}
            onPress={() => {
              setValue("examId", exam.exam_id, { shouldValidate: true });
              const supportedCounts = [3, 5, 10, 15, 20].filter(
                (count) => count <= exam.available_question_count,
              );
              if (!supportedCounts.includes(questionCount)) {
                setValue(
                  "questionCount",
                  supportedCounts.includes(5) ? 5 : (supportedCounts[0] ?? 3),
                  {
                    shouldValidate: true,
                  },
                );
              }
            }}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={selected ? styles.optionTextSelected : styles.optionText}>
              {exam.exam_title} · {exam.available_question_count} available
            </Text>
          </Pressable>
        );
      })}
      {exams.data?.length === 0 ? (
        <Text style={styles.warning}>
          At least three approved active questions are required before a challenge can be created.
        </Text>
      ) : null}

      {examId ? (
        <>
          <Text style={styles.fieldLabel}>Question count</Text>
          <View style={styles.actionRow}>
            {countOptions.map((count) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: count === questionCount }}
                key={count}
                onPress={() => setValue("questionCount", count, { shouldValidate: true })}
                style={[styles.countOption, count === questionCount && styles.optionSelected]}
              >
                <Text
                  style={count === questionCount ? styles.optionTextSelected : styles.optionText}
                >
                  {count}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.muted}>
        Pilot duration: 7 days. Points reward completion (40), accuracy (up to 40), and improvement
        (up to 20).
      </Text>
      <AppButton
        disabled={studentIds.length !== 2 || !examId}
        label="Create private challenge"
        loading={create.isPending}
        onPress={() =>
          void handleSubmit(async (input) => {
            await create.mutateAsync(input);
            reset();
          })()
        }
      />
      {create.isError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {safeError(create.error)}
        </Text>
      ) : null}
      {create.isSuccess ? (
        <Text style={styles.success}>Challenge created with identical question sets.</Text>
      ) : null}
    </AppCard>
  );
}

function ChallengeCard({
  challenge,
  currentUserId,
}: {
  challenge: PrivateChallenge;
  currentUserId: string;
}) {
  const router = useRouter();
  const encouragements = useChallengeEncouragements(challenge.challenge_id);
  const send = useSendChallengeEncouragement(challenge.challenge_id);
  const own = challenge.participants.find((participant) => participant.studentId === currentUserId);

  return (
    <AppCard
      title={challenge.title}
      description={`${challenge.exam_title} · Same ${challenge.question_count}-question set · ${formatDate(challenge.ends_at)} deadline`}
    >
      {!challenge.results_revealed ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Results stay private until both students finish. Completion status is shown without
            scores.
          </Text>
        </View>
      ) : (
        <Text style={styles.success}>Both students finished. Supportive results are unlocked.</Text>
      )}

      {challenge.participants.map((participant) => (
        <View key={participant.studentId} style={styles.participant}>
          <View style={styles.participantHeader}>
            <Text style={styles.itemTitle}>{participant.name}</Text>
            <Text style={participant.completed ? styles.success : styles.muted}>
              {participant.completed ? "Finished" : "In progress"}
            </Text>
          </View>
          {challenge.results_revealed ? (
            <View style={styles.resultGrid}>
              <Result
                label="Questions correct"
                value={`${Math.round(participant.scorePercent ?? 0)}%`}
              />
              <Result
                label="Improvement"
                value={
                  participant.improvementPercent === null
                    ? "Baseline building"
                    : `${participant.improvementPercent >= 0 ? "+" : ""}${Math.round(participant.improvementPercent)}%`
                }
              />
              <Result label="Positive points" value={String(participant.totalPoints ?? 0)} />
              <Text style={styles.recognition}>{participant.recognition}</Text>
            </View>
          ) : null}

          {participant.studentId !== currentUserId ? (
            <View style={styles.reactions}>
              <Text style={styles.smallLabel}>Encourage {participant.name}</Text>
              <View style={styles.actionRow}>
                {encouragementReactionSchema.options.map((reaction) => (
                  <Pressable
                    accessibilityRole="button"
                    disabled={send.isPending}
                    key={reaction}
                    onPress={() =>
                      void send.mutateAsync({
                        challengeId: challenge.challenge_id,
                        reaction,
                        recipientId: participant.studentId,
                      })
                    }
                    style={styles.reaction}
                  >
                    <Text style={styles.reactionText}>{ENCOURAGEMENT_LABELS[reaction]}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ))}

      {own && !own.completed ? (
        <AppButton
          label="Continue my challenge"
          onPress={() =>
            router.push({
              pathname: "/study/session/[sessionId]",
              params: { sessionId: own.sessionId },
            })
          }
        />
      ) : null}

      <View style={styles.encouragementList}>
        <Text style={styles.fieldLabel}>Encouragements</Text>
        {encouragements.isPending ? <Text style={styles.muted}>Loading reactions…</Text> : null}
        {encouragements.data?.length === 0 ? (
          <Text style={styles.muted}>No reactions yet.</Text>
        ) : null}
        {encouragements.data?.map((item) => (
          <Text key={item.encouragement_id} style={styles.muted}>
            {item.sender_name} to {item.recipient_name}: {ENCOURAGEMENT_LABELS[item.reaction]}
          </Text>
        ))}
      </View>
    </AppCard>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.result}>
      <Text style={styles.resultValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function safeError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string")
    return error.message;
  return "The challenge request could not be completed.";
}

const styles = StyleSheet.create({
  achievement: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    opacity: 0.72,
    padding: theme.spacing.md,
  },
  achievementEarned: {
    backgroundColor: "#E4F3EA",
    borderColor: theme.colors.success,
    opacity: 1,
  },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  countOption: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    minWidth: 52,
    padding: theme.spacing.sm,
  },
  encouragementList: { gap: theme.spacing.xs },
  error: { color: theme.colors.danger, fontSize: 14, lineHeight: 20 },
  fieldLabel: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  itemTitle: { color: theme.colors.ink, fontSize: 16, fontWeight: "900" },
  muted: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  notice: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
  },
  noticeText: { color: theme.colors.primary, fontSize: 13, lineHeight: 19 },
  option: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  optionSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  optionText: { color: theme.colors.primary, fontSize: 15, fontWeight: "800" },
  optionTextSelected: { color: theme.colors.surface, fontSize: 15, fontWeight: "800" },
  participant: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  participantHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reaction: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  reactionText: { color: theme.colors.primary, fontSize: 12, fontWeight: "800" },
  reactions: { gap: theme.spacing.xs },
  recognition: { color: theme.colors.accent, fontSize: 14, fontWeight: "900" },
  result: { minWidth: 120 },
  resultGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  resultValue: { color: theme.colors.primary, fontSize: 19, fontWeight: "900" },
  smallLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: "800" },
  success: { color: theme.colors.success, fontSize: 14, fontWeight: "800" },
  warning: { color: theme.colors.accent, fontSize: 13, lineHeight: 19 },
});
