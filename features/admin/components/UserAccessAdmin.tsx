import { useState } from "react";
import { LearningAccessEditor } from "./LearningAccessEditor";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppCard } from "../../../components/common/AppCard";
import { AppTextField } from "../../../components/common/AppTextField";
import { theme } from "../../../lib/constants/theme";
import { useAdminUserAccessOverview } from "../hooks/useAdminUserAccess";
import { packetGroupIdentity } from "../packetGrouping";
import type { AdminAccessPacket, AdminAccessUser } from "../schemas";

export function UserAccessAdmin() {
  const overview = useAdminUserAccessOverview();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const selectedUser = overview.data?.users.find((user) => user.user_id === selectedId);

  if (selectedUser && overview.data) {
    return (
      <LearningAccessEditor
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
        description="Search registered accounts, then open one user to manage Study and Content Review access."
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
          accessibilityHint="Opens Study and Content Review permissions"
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
  assignedGroup: { color: theme.colors.ink, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  assignedSummary: { gap: 2 },
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
  manageLabel: { color: theme.colors.accent, fontSize: 14, fontWeight: "900" },
  muted: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  noRole: { color: theme.colors.danger, fontSize: 13, fontWeight: "700" },
  packetSummary: { color: theme.colors.ink, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.78 },
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
  summary: { color: theme.colors.primary, fontSize: 14, fontWeight: "800" },
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
});
