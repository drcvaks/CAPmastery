import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { AppCard } from "../../../components/common/AppCard";
import { AppButton } from "../../../components/common/AppButton";
import { theme } from "../../../lib/constants/theme";
import {
  learningAccess,
  type LearningAccessSection,
  type TesterGrant,
} from "../../../services/contentTesterService";
import { adminUserAccessKeys } from "../hooks/useAdminUserAccess";
import { packetGroupIdentity } from "../packetGrouping";
import type { AdminAccessPacket, AdminAccessUser } from "../schemas";

type Props = { user: AdminAccessUser; packets: AdminAccessPacket[]; onBack: () => void };
type Access = Awaited<ReturnType<typeof learningAccess>>;

export function LearningAccessEditor(props: Props) {
  const access = useQuery({
    queryKey: ["admin-learning-access", props.user.user_id],
    queryFn: () => learningAccess(props.user.user_id),
    gcTime: 0,
  });
  return (
    <View style={styles.stack}>
      <View style={{ alignItems: "flex-start" }}>
        <AppButton label="Back to all users" onPress={props.onBack} variant="secondary" />
      </View>
      <AppCard title={props.user.display_name} description={props.user.email ?? "No email address"}>
        {access.isError ? (
          <>
            <Text accessibilityRole="alert">Could not load content access.</Text>
            <AppButton
              label="Try again"
              onPress={() => void access.refetch()}
              variant="secondary"
            />
          </>
        ) : access.data ? (
          <Assignments {...props} data={access.data} />
        ) : (
          <Text>Loading study and review access…</Text>
        )}
      </AppCard>
    </View>
  );
}

function Assignments({ user, packets, data }: Props & { data: Access }) {
  const [student, setStudent] = useState(user.roles.includes("student"));
  const [selected, setSelected] = useState(user.assigned_packages);
  const [grants, setGrants] = useState(data.grants);
  const [dirty, setDirty] = useState({ student: false, review: false });
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      learningAccess(user.user_id, {
        studentEnabled: dirty.student ? student : undefined,
        packages: dirty.student ? (student ? selected : []) : undefined,
        grants: dirty.review ? grants : undefined,
      }),
    onSuccess: (result) => {
      client.setQueryData(["admin-learning-access", user.user_id], result);
      setDirty({ student: false, review: false });
      void client.invalidateQueries({ queryKey: adminUserAccessKeys.overview });
    },
  });
  const sections = data.sections;
  const exams = [...new Map(sections.map((s) => [s.exam_id, s.exam_title]))].sort((a, b) => {
    return (
      packetGroupIdentity(a[1]).order - packetGroupIdentity(b[1]).order || a[1].localeCompare(b[1])
    );
  });
  const packetByCode = new Map(packets.map((p) => [p.import_package, p]));
  const placements = new Map<string, number>();
  for (const s of sections.filter((s) => s.module_number === null || s.chapter_id === null)) {
    for (const code of s.packages) placements.set(code, (placements.get(code) ?? 0) + 1);
  }

  function edit(kind: "student" | "review") {
    save.reset();
    setDirty((current) => ({ ...current, [kind]: true }));
  }

  function setPackets(codes: string[], enabled: boolean) {
    edit("student");
    setSelected((current) =>
      enabled
        ? [...new Set([...current, ...codes])]
        : current.filter((code) => !codes.includes(code)),
    );
  }

  function study(codes: string[], sectionTitle: string, shared = false) {
    return codes.map((code) => {
      const packet = packetByCode.get(code);
      return (
        <AccessSwitch
          key={code}
          title="Study packet"
          detail={[
            packet ? `${packet.question_count} questions` : "",
            shared || codes.length > 1 || !packet ? packet?.topic_titles.join(" · ") || code : "",
          ]
            .filter(Boolean)
            .join(" · ")}
          label={`${sectionTitle}: Study packet (${code})`}
          disabled={save.isPending || !student}
          value={student && selected.includes(code)}
          onChange={(value) => setPackets([code], value)}
        />
      );
    });
  }

  function review(
    title: string,
    exam: string | null,
    chapters: (string | null)[],
    section?: LearningAccessSection,
  ) {
    return (["question", "image"] as const).map((kind) => {
      const matches = (g: TesterGrant) =>
        g.kind === kind && g.exam_id === exam && chapters.includes(g.chapter_id);
      const inherited = grants.some(
        (g) =>
          g.kind === kind &&
          ((g.exam_id === null && exam !== null) ||
            (g.exam_id === exam && g.chapter_id === null && !chapters.includes(null))),
      );
      const assigned = chapters.filter((chapter) =>
        grants.some((g) => matches(g) && g.chapter_id === chapter),
      ).length;
      const name = kind === "question" ? "Review questions & answers" : "Review images";
      const count = section && (kind === "question" ? section.question_count : section.image_count);
      const detail = [
        count === undefined ? "" : `${count} ${kind === "question" ? "questions" : "images"}`,
        inherited
          ? "Included by broader access"
          : assigned > 0 && assigned < chapters.length
            ? `${assigned} of ${chapters.length} chapters selected`
            : "",
      ]
        .filter(Boolean)
        .join(" · ");
      return (
        <AccessSwitch
          key={kind}
          title={name}
          detail={detail}
          label={`${title}: ${name}`}
          value={inherited || assigned === chapters.length}
          disabled={save.isPending || inherited || !chapters.length || (count === 0 && !assigned)}
          onChange={(value) => {
            edit("review");
            setGrants((current) => [
              ...current.filter((g) => !matches(g)),
              ...(value ? chapters.map((chapter_id) => ({ kind, exam_id: exam, chapter_id })) : []),
            ]);
          }}
        />
      );
    });
  }

  return (
    <View style={styles.stack}>
      <Text style={styles.heading}>Study & Content Review access</Text>
      <Text style={styles.muted}>
        Study packets open in Student. Review permissions open in Content Review, where question
        reviewers can see answer keys. Grant them separately.
      </Text>
      <AccessSwitch
        title="Student workspace"
        label="Student workspace access"
        value={student}
        disabled={save.isPending}
        onChange={(value) => {
          edit("student");
          setStudent(value);
        }}
      />
      {!student ? (
        <Text style={styles.muted}>
          Turn on Student workspace access to assign study packets.
          {selected.length ? " Saving with it off removes existing study packets." : ""}
        </Text>
      ) : null}
      {user.roles.some((role) => role === "admin" || role === "content_reviewer") ? (
        <Text style={styles.muted}>
          Review assignments do not restrict this account’s broader content roles.
        </Text>
      ) : null}
      <Disclosure title="All tests · Review access">{review("All tests", null, [null])}</Disclosure>
      {exams.map(([id, title]) => {
        const exam = sections.filter((s) => s.exam_id === id);
        const parents = exam.filter((s) => s.module_number === null || s.chapter_id === null);
        const examPackets = [...new Set(exam.flatMap((s) => s.packages))].filter(
          (code) => packetByCode.get(code)?.exam_title === title,
        );
        return (
          <Disclosure
            key={id}
            title={packetGroupIdentity(title).title}
            summary={`${parents.length} ${parents.some((s) => s.module_number !== null) ? "modules / chapters" : "chapters"}`}
          >
            <Disclosure title="Whole test · Review access">{review(title, id, [null])}</Disclosure>
            {examPackets.length > 1 ? (
              <AccessSwitch
                title="All study packets in this test"
                detail={`${examPackets.filter((code) => selected.includes(code) && student).length} of ${examPackets.length} selected`}
                label={`${title}: All study packets`}
                disabled={!student || save.isPending}
                value={student && examPackets.every((code) => selected.includes(code))}
                onChange={(value) => setPackets(examPackets, value)}
              />
            ) : null}
            {study(
              examPackets.filter((code) => (placements.get(code) ?? 0) > 1),
              title,
              true,
            )}
            {parents.map((s) => {
              const children =
                s.chapter_id === null
                  ? exam.filter(
                      (child) =>
                        child.module_number === s.module_number && child.chapter_id !== null,
                    )
                  : [];
              const label = s.module_number === null ? s.title : `Module ${s.module_number}`;
              return (
                <Disclosure key={s.chapter_id ?? s.module_number} title={label} summary={counts(s)}>
                  {s.module_number !== null && s.title !== label ? (
                    <Text style={styles.muted}>{s.title}</Text>
                  ) : null}
                  {study(
                    s.packages.filter((code) => placements.get(code) === 1),
                    label,
                  )}
                  {review(
                    label,
                    id,
                    s.chapter_id ? [s.chapter_id] : [...new Set(children.map((c) => c.chapter_id))],
                    s,
                  )}
                  {children.map((child) => (
                    <Disclosure key={child.chapter_id} title={child.title} summary={counts(child)}>
                      <Text style={styles.muted}>
                        Study packets are assigned at the module level.
                      </Text>
                      {review(`${label} · ${child.title}`, id, [child.chapter_id], child)}
                    </Disclosure>
                  ))}
                </Disclosure>
              );
            })}
          </Disclosure>
        );
      })}
      <AppButton
        label="Save access"
        disabled={!dirty.student && !dirty.review}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
      {save.isSuccess ? <Text accessibilityRole="alert">Access saved.</Text> : null}
      {save.isError ? (
        <Text accessibilityRole="alert">
          Could not confirm the save. Try again or reopen this account to check its access.
        </Text>
      ) : null}
    </View>
  );
}

function counts(section: LearningAccessSection) {
  return `${section.question_count} questions · ${section.image_count} images`;
}

function Disclosure({
  title,
  summary,
  children,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.disclosure}>
      <Pressable
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={styles.header}
      >
        <Text style={styles.heading}>
          {open ? "▾" : "▸"} {title}
        </Text>
        {summary ? <Text style={styles.muted}>{summary}</Text> : null}
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

function AccessSwitch({
  title,
  detail,
  label,
  disabled,
  value,
  onChange,
}: {
  title: string;
  detail?: string;
  label: string;
  disabled?: boolean;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.heading}>{title}</Text>
        {detail ? <Text style={styles.muted}>{detail}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled }}
        disabled={disabled}
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: theme.spacing.md },
  heading: { color: theme.colors.ink, fontWeight: "800" },
  muted: { color: theme.colors.muted, fontSize: 13, lineHeight: 18 },
  disclosure: { borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md },
  header: { padding: theme.spacing.sm, gap: 2, minHeight: 44, justifyContent: "center" },
  body: {
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  row: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
});
