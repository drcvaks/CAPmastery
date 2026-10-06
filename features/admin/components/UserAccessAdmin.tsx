import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppTextField } from "../../../components/common/AppTextField";
import { theme } from "../../../lib/constants/theme";
import {
  useAdminUserAccessOverview,
  useUpdateAdminStudentAccess,
} from "../hooks/useAdminUserAccess";
import type { AdminAccessPacket, AdminAccessUser } from "../schemas";

export function UserAccessAdmin() {
  const overview = useAdminUserAccessOverview();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const selectedUser = overview.data?.users.find((user) => user.user_id === selectedId);

  if (selectedUser && overview.data) {
    return (
      <UserAccessEditor
        key={selectedUser.user_id}
        onBack={() => setSelectedId(undefined)}
        packets={overview.data.packages}
        user={selectedUser}
      />
    );
  }

  const normalizedQuery = query.trim().toLowerCase();
  const users =
    overview.data?.users.filter((user) =>
      `${user.display_name} ${user.email ?? ""} ${user.roles.join(" ")}`
        .toLowerCase()
        .includes(normalizedQuery),
    ) ?? [];
  const studentCount = overview.data?.users.filter((user) => user.roles.includes("student")).length;

  return (
    <View style={styles.stack}>
      <AppCard
        description="Search every registered account, see current roles and packets, then open one user to change student access."
        title="Registered users"
      >
        <AppTextField
          autoCapitalize="none"
          autoCorrect={false}
          label="Search by name, email, or role"
          onChangeText={setQuery}
          placeholder="Start typing to filter users"
          value={query}
        />
        {overview.data ? (
          <Text style={styles.summary}>
            {overview.data.users.length} registered · {studentCount} students ·{" "}
            {overview.data.packages.length} study packets
          </Text>
        ) : null}
        {overview.isPending ? <Text style={styles.muted}>Loading registered users…</Text> : null}
        {overview.isError ? <ErrorText value={overview.error} /> : null}
        {overview.data && users.length === 0 ? (
          <Text style={styles.muted}>No registered users match that search.</Text>
        ) : null}
      </AppCard>

      {users.map((user) => (
        <Pressable
          accessibilityHint="Opens student-role and study-packet controls"
          accessibilityLabel={`Manage access for ${user.display_name}`}
          accessibilityRole="button"
          key={user.user_id}
          onPress={() => setSelectedId(user.user_id)}
          style={({ pressed }) => [styles.userCard, pressed && styles.pressed]}
        >
          <View style={styles.userHeading}>
            <View style={styles.userIdentity}>
              <Text style={styles.userName}>{user.display_name}</Text>
              <Text style={styles.email}>{user.email ?? "No email address"}</Text>
            </View>
            <Text style={[styles.status, user.status === "disabled" && styles.statusDisabled]}>
              {user.status}
            </Text>
          </View>
          <View style={styles.chips}>
            {user.roles.length ? (
              user.roles.map((role) => (
                <Text key={role} style={[styles.chip, role === "student" && styles.studentChip]}>
                  {role}
                </Text>
              ))
            ) : (
              <Text style={styles.noRole}>No workspace role</Text>
            )}
          </View>
          <AssignedPacketSummary packets={overview.data?.packages ?? []} user={user} />
          <Text style={styles.manageLabel}>Manage access →</Text>
        </Pressable>
      ))}
    </View>
  );
}

function UserAccessEditor({
  onBack,
  packets,
  user,
}: {
  onBack: () => void;
  packets: AdminAccessPacket[];
  user: AdminAccessUser;
}) {
  const update = useUpdateAdminStudentAccess();
  const [studentEnabled, setStudentEnabled] = useState(user.roles.includes("student"));
  const [selectedPackages, setSelectedPackages] = useState(() => new Set(user.assigned_packages));
  const groupedPackets = useMemo(() => groupPackets(packets), [packets]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  function setPackage(packageCode: string, enabled: boolean) {
    setSelectedPackages((current) => {
      const next = new Set(current);
      if (enabled) next.add(packageCode);
      else next.delete(packageCode);
      return next;
    });
    update.reset();
  }

  function setStudent(value: boolean) {
    setStudentEnabled(value);
    if (!value) setSelectedPackages(new Set());
    update.reset();
  }

  function toggleGroup(groupKey: string) {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }

  function setGroupPackages(groupPackets: AdminAccessPacket[], enabled: boolean) {
    setSelectedPackages((current) => {
      const next = new Set(current);
      for (const packet of groupPackets) {
        if (enabled) next.add(packet.import_package);
        else next.delete(packet.import_package);
      }
      return next;
    });
    update.reset();
  }

  const selectedList = packets
    .map((packet) => packet.import_package)
    .filter((packageCode) => selectedPackages.has(packageCode));

  return (
    <View style={styles.stack}>
      <View style={styles.backAction}>
        <AppButton label="Back to all users" onPress={onBack} variant="secondary" />
      </View>
      <AppCard
        description={`${user.email ?? "No email address"} · ${user.status}`}
        title={user.display_name}
      >
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>Student workspace</Text>
            <Text style={styles.muted}>
              Grant the Student role so this account can open assigned study content.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Student workspace access"
            onValueChange={setStudent}
            trackColor={{ false: theme.colors.border, true: theme.colors.success }}
            value={studentEnabled}
          />
        </View>
        {!studentEnabled && user.assigned_packages.length ? (
          <Text accessibilityRole="alert" style={styles.warning}>
            Saving with Student access off will remove all existing packet assignments.
          </Text>
        ) : null}
      </AppCard>

      <AppCard
        description={
          studentEnabled
            ? `${selectedList.length} of ${packets.length} packets selected. Changes take effect after Save.`
            : "Turn on Student workspace access to choose packets."
        }
        title="Study packets"
      >
        <View style={styles.actionRow}>
          <AppButton
            disabled={!studentEnabled}
            label="Select all packets"
            onPress={() => {
              setSelectedPackages(new Set(packets.map((packet) => packet.import_package)));
              update.reset();
            }}
            variant="secondary"
          />
          <AppButton
            disabled={!studentEnabled || selectedPackages.size === 0}
            label="Clear all packets"
            onPress={() => {
              setSelectedPackages(new Set());
              update.reset();
            }}
            variant="secondary"
          />
        </View>
        {groupedPackets.map((group) => {
          const expanded = expandedGroups.has(group.key);
          const selectedInGroup = group.packets.filter((packet) =>
            selectedPackages.has(packet.import_package),
          ).length;
          return (
            <View key={group.key} style={styles.packetGroup}>
              <Pressable
                accessibilityHint={
                  expanded ? "Collapses this packet group" : "Expands this packet group"
                }
                accessibilityLabel={`${group.title} packets`}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => toggleGroup(group.key)}
                style={({ pressed }) => [styles.groupHeader, pressed && styles.pressed]}
              >
                <View style={styles.groupHeadingCopy}>
                  <Text style={styles.examTitle}>{group.title}</Text>
                  <Text style={styles.groupCount}>
                    {selectedInGroup} of {group.packets.length} selected
                  </Text>
                </View>
                <Text accessibilityElementsHidden style={styles.chevron}>
                  {expanded ? "−" : "+"}
                </Text>
              </Pressable>
              {expanded ? (
                <View style={styles.groupBody}>
                  <View style={styles.actionRow}>
                    <AppButton
                      disabled={!studentEnabled || selectedInGroup === group.packets.length}
                      label={`Select all ${group.title}`}
                      onPress={() => setGroupPackages(group.packets, true)}
                      variant="secondary"
                    />
                    <AppButton
                      disabled={!studentEnabled || selectedInGroup === 0}
                      label={`Clear ${group.title}`}
                      onPress={() => setGroupPackages(group.packets, false)}
                      variant="secondary"
                    />
                  </View>
                  {group.packets.map((packet) => (
                    <View key={packet.import_package} style={styles.packetRow}>
                      <View style={styles.packetCopy}>
                        <Text style={styles.packetTopics}>{packet.topic_titles.join(" · ")}</Text>
                        <Text style={styles.packetCode}>{packet.import_package}</Text>
                        <Text style={styles.questionCount}>{packet.question_count} questions</Text>
                      </View>
                      <Switch
                        accessibilityLabel={`Assign ${packet.import_package}`}
                        accessibilityState={{
                          checked: studentEnabled && selectedPackages.has(packet.import_package),
                          disabled: !studentEnabled,
                        }}
                        disabled={!studentEnabled}
                        onValueChange={(enabled) => setPackage(packet.import_package, enabled)}
                        trackColor={{ false: theme.colors.border, true: theme.colors.success }}
                        value={studentEnabled && selectedPackages.has(packet.import_package)}
                      />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
        <AppButton
          label="Save student access"
          loading={update.isPending}
          onPress={() =>
            void update
              .mutateAsync({
                userId: user.user_id,
                studentEnabled,
                importPackages: studentEnabled ? selectedList : [],
              })
              .catch(() => undefined)
          }
        />
        {update.isSuccess ? (
          <Text accessibilityRole="alert" style={styles.success}>
            Student role and packet assignments saved.
          </Text>
        ) : null}
        {update.isError ? <ErrorText value={update.error} /> : null}
      </AppCard>
    </View>
  );
}

type PacketGroup = { key: string; title: string; order: number; packets: AdminAccessPacket[] };

function AssignedPacketSummary({
  packets,
  user,
}: {
  packets: AdminAccessPacket[];
  user: AdminAccessUser;
}) {
  if (user.assigned_packages.length === 0) {
    return <Text style={styles.packetSummary}>No study packets assigned</Text>;
  }

  const assigned = new Set(user.assigned_packages);
  const groups = groupPackets(packets.filter((packet) => assigned.has(packet.import_package)));
  const resolved = new Set(groups.flatMap((group) => group.packets.map((p) => p.import_package)));
  const unresolvedCount = user.assigned_packages.filter((code) => !resolved.has(code)).length;

  return (
    <View style={styles.assignedSummary}>
      <Text style={styles.packetSummary}>
        {user.assigned_packages.length} assigned{" "}
        {user.assigned_packages.length === 1 ? "packet" : "packets"}
      </Text>
      {groups.map((group) => (
        <Text key={group.key} numberOfLines={1} style={styles.assignedGroup}>
          {group.title} · {summarizeSections(group.packets)}
        </Text>
      ))}
      {unresolvedCount ? (
        <Text style={styles.assignedGroup}>
          {unresolvedCount} additional {unresolvedCount === 1 ? "packet" : "packets"}
        </Text>
      ) : null}
    </View>
  );
}

function groupPackets(packets: AdminAccessPacket[]): PacketGroup[] {
  const groups = new Map<string, PacketGroup>();
  for (const packet of packets) {
    const identity = packetGroupIdentity(packet.exam_title);
    const group = groups.get(identity.key) ?? { ...identity, packets: [] };
    group.packets.push(packet);
    groups.set(identity.key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      packets: [...group.packets].sort((a, b) =>
        a.import_package.localeCompare(b.import_package, undefined, { numeric: true }),
      ),
    }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function packetGroupIdentity(examTitle: string) {
  const normalized = examTitle.toLowerCase();
  if (normalized.includes("wright brothers")) {
    return { key: "wright-brothers", title: "Wright Brothers", order: 0 };
  }
  if (normalized.includes("billy mitchell") && normalized.includes("leadership")) {
    return { key: "mitchell-leadership", title: "Billy Mitchell Leadership", order: 1 };
  }
  if (normalized.includes("billy mitchell") && normalized.includes("aerospace")) {
    return { key: "mitchell-aerospace", title: "Billy Mitchell Aerospace", order: 2 };
  }
  if (normalized.includes("earhart")) {
    return { key: "earhart", title: "Earhart", order: 3 };
  }
  return { key: `other-${examTitle}`, title: examTitle, order: 100 };
}

function summarizeSections(packets: AdminAccessPacket[]) {
  const labels = packets.map((packet) => packetSection(packet));
  const kinds = new Set(labels.map((label) => label.kind));
  if (kinds.size === 1 && labels.every((label) => label.number !== null)) {
    const kind = labels[0]?.kind ?? "Section";
    const numbers = [...new Set(labels.map((label) => label.number as number))].sort(
      (a, b) => a - b,
    );
    return `${kind}${numbers.length === 1 ? "" : "s"} ${compactRanges(numbers)}`;
  }
  return labels.map((label) => label.fallback).join(", ");
}

function packetSection(packet: AdminAccessPacket) {
  const chapter = packet.import_package.match(/^LTL\d+_C(\d+)_/);
  if (chapter) {
    return { kind: "Chapter", number: Number(chapter[1]), fallback: `Chapter ${chapter[1]}` };
  }
  const module = packet.import_package.match(/^AD_M(\d+)_/);
  if (module) {
    return { kind: "Module", number: Number(module[1]), fallback: `Module ${module[1]}` };
  }
  return {
    kind: "Section",
    number: null,
    fallback: packet.topic_titles[0] ?? packet.exam_title,
  };
}

function compactRanges(numbers: number[]) {
  const ranges: string[] = [];
  let start = numbers[0];
  let end = numbers[0];
  for (const value of numbers.slice(1)) {
    if (end !== undefined && value === end + 1) {
      end = value;
      continue;
    }
    if (start !== undefined && end !== undefined)
      ranges.push(start === end ? `${start}` : `${start}–${end}`);
    start = value;
    end = value;
  }
  if (start !== undefined && end !== undefined)
    ranges.push(start === end ? `${start}` : `${start}–${end}`);
  return ranges.join(", ");
}

function ErrorText({ value }: { value: unknown }) {
  const message =
    value instanceof Error
      ? value.message
      : typeof value === "object" && value && "message" in value
        ? String(value.message)
        : "The request could not be completed.";
  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  assignedGroup: { color: theme.colors.ink, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  assignedSummary: { gap: 2 },
  backAction: { alignItems: "flex-start" },
  chip: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 999,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    textTransform: "capitalize",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs },
  email: { color: theme.colors.muted, fontSize: 14 },
  error: { color: theme.colors.danger, fontSize: 14, lineHeight: 20 },
  examTitle: { color: theme.colors.primary, fontSize: 17, fontWeight: "900" },
  chevron: { color: theme.colors.accent, fontSize: 28, fontWeight: "700", lineHeight: 30 },
  groupBody: { gap: theme.spacing.sm, padding: theme.spacing.md },
  groupCount: { color: theme.colors.muted, fontSize: 13, fontWeight: "700" },
  groupHeader: {
    alignItems: "center",
    backgroundColor: theme.colors.primarySoft,
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
    minHeight: 62,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  groupHeadingCopy: { flex: 1, gap: 3 },
  manageLabel: { color: theme.colors.accent, fontSize: 14, fontWeight: "900" },
  muted: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  noRole: { color: theme.colors.danger, fontSize: 13, fontWeight: "700" },
  packetCode: { color: theme.colors.ink, fontSize: 15, fontWeight: "900" },
  packetCopy: { flex: 1, gap: 3 },
  packetGroup: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  packetRow: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
    minHeight: 76,
    padding: theme.spacing.md,
  },
  packetSummary: { color: theme.colors.ink, fontSize: 14, lineHeight: 20 },
  packetTopics: { color: theme.colors.ink, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.78 },
  questionCount: { color: theme.colors.muted, fontSize: 12 },
  stack: { gap: theme.spacing.md },
  status: {
    backgroundColor: "#E6F4EC",
    borderRadius: 999,
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    textTransform: "capitalize",
  },
  statusDisabled: { backgroundColor: theme.colors.accentSoft, color: theme.colors.danger },
  studentChip: { backgroundColor: "#E6F4EC", color: theme.colors.success },
  success: { color: theme.colors.success, fontSize: 14, fontWeight: "800" },
  summary: { color: theme.colors.primary, fontSize: 14, fontWeight: "800" },
  switchCopy: { flex: 1, gap: theme.spacing.xs },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
  },
  switchTitle: { color: theme.colors.ink, fontSize: 17, fontWeight: "900" },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  userHeading: { flexDirection: "row", gap: theme.spacing.md, justifyContent: "space-between" },
  userIdentity: { flex: 1, gap: 3 },
  userName: { color: theme.colors.ink, fontSize: 19, fontWeight: "900" },
  warning: { color: theme.colors.danger, fontSize: 14, fontWeight: "700", lineHeight: 20 },
});
